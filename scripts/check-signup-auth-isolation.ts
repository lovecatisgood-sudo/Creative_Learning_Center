import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { readFile, readdir } from "node:fs/promises";
import { createServer } from "node:net";
import path from "node:path";
import { Pool } from "pg";

const baseUrl = process.env.TEST_DATABASE_URL;
if (!baseUrl || process.env.MEMBER_TEST_DATABASE !== "1" || !new URL(baseUrl).pathname.toLowerCase().includes("test")) {
  throw new Error("Refusing to run signup isolation checks outside an explicitly marked test database");
}

const databaseName = `creative_signup_test_${randomUUID().replaceAll("-", "")}`;
assert.match(databaseName, /^[a-z0-9_]+$/);
const admin = new Pool({ connectionString: baseUrl });
const testUrl = new URL(baseUrl);
testUrl.pathname = `/${databaseName}`;
let database: Pool | undefined;
let server: ChildProcess | undefined;
let serverOutput = "";

async function main(): Promise<void> {
  try {
    await admin.query(`create database ${databaseName}`);
    database = new Pool({ connectionString: testUrl.toString(), max: 2 });
    await applyCreativeMigrations(database);

    const port = await availablePort();
    server = spawn(
      process.execPath,
      [path.join(process.cwd(), "node_modules/next/dist/bin/next"), "start", "-H", "127.0.0.1", "-p", String(port)],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          NODE_ENV: "production",
          DATABASE_URL: testUrl.toString(),
          APP_ORIGIN: "https://creative.siamesecat.cafe",
          MEMBER_SCHEMA_READY: "1",
          SIAMESE_GAME_SCHEMA_READY: "1",
          MEMBER_SESSION_SECRET: "signup-isolation-member-session-secret-2026-08-26",
          SESSION_SECRET: "signup-isolation-admin-session-secret-2026-08-26",
          SIAMESE_CREATIVE_AUTH_ENABLED: "true",
          SIAMESE_CREATIVE_AUTH_ENV: "production",
          SIAMESE_OIDC_ISSUER: "https://id.siamesecat.cafe",
          SIAMESE_CREATIVE_CLIENT_ID: "creative-signup-isolation-test",
          SIAMESE_CREATIVE_CLIENT_SECRET: "",
          SIAMESE_CREATIVE_TRANSACTION_SECRET: "",
          TERMS_VERSION: "signup-isolation-terms-v1",
          PRIVACY_VERSION: "signup-isolation-privacy-v1",
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    server.stdout?.on("data", captureServerOutput);
    server.stderr?.on("data", captureServerOutput);
    await waitForServer(`http://127.0.0.1:${port}/api/public/health`);

    const rejected = await postSignup(port, "https://attacker.example", {
      parentName: "Rejected Origin Parent",
      phone: "0810000000",
      email: "rejected-origin@example.test",
      language: "en",
      programInterest: "",
      consent: true,
      membershipChoice: "connect",
      children: [{ name: "Should Not Persist", dob: "2020-01-01", gender: "female" }],
    });
    assert.equal(rejected.status, 403);
    assertPrivate(rejected);
    assert.deepEqual(await coreCounts(database), { parents: 0, children: 0, members: 0, consents: 0 });

    const connected = await postSignup(port, "https://creative.siamesecat.cafe", {
      parentName: "Connect Parent",
      phone: "0811111111",
      email: "connect-parent@example.test",
      language: "en",
      programInterest: "",
      consent: true,
      membershipChoice: "connect",
      children: [
        { name: "Connect Child One", dob: "2020-01-01", gender: "female" },
        { name: "Connect Child Two", dob: "2021-02-02", gender: "male" },
      ],
    });
    assert.equal(connected.status, 200);
    assertPrivate(connected);
    assert.match(connected.headers.get("set-cookie") ?? "", /sccc_member=/);
    const connectedBody = await connected.json() as Record<string, unknown>;
    assert.equal(connectedBody.ok, true);
    assert.equal(connectedBody.membershipConnection, "pending");
    assert.equal("membershipStartUrl" in connectedBody, false);
    assert.equal("memberProvisioningPending" in connectedBody, false);
    assert.deepEqual(connectedBody.childNames, ["Connect Child One", "Connect Child Two"]);

    const skipped = await postSignup(port, "https://creative.siamesecat.cafe", {
      parentName: "Skip Parent",
      phone: "0822222222",
      email: "skip-parent@example.test",
      language: "th",
      programInterest: "",
      consent: true,
      membershipChoice: "skip",
      children: [{ name: "Skip Child", dob: "2022-03-03", gender: "female" }],
    });
    assert.equal(skipped.status, 200);
    assertPrivate(skipped);
    const skippedBody = await skipped.json() as Record<string, unknown>;
    assert.equal(skippedBody.ok, true);
    assert.equal(skippedBody.membershipConnection, "skipped");
    assert.equal("membershipStartUrl" in skippedBody, false);
    assert.deepEqual(skippedBody.childNames, ["Skip Child"]);

    assert.deepEqual(await coreCounts(database), { parents: 2, children: 3, members: 2, consents: 4 });
    const identityState = await database.query<{
      contact_emails: string;
      member_emails: string;
      verified_emails: string;
      link_attempts: string;
      terms: string;
      privacy: string;
    }>(
      `select
         (select count(*)::text from parents where email is not null) as contact_emails,
         (select count(*)::text from member_accounts where email_normalized is not null) as member_emails,
         (select count(*)::text from member_accounts where email_verified_at is not null) as verified_emails,
         (select count(*)::text from creative_member_link_attempts) as link_attempts,
         (select count(*)::text from member_consents where type = 'terms' and policy_version = 'signup-isolation-terms-v1') as terms,
         (select count(*)::text from member_consents where type = 'privacy' and policy_version = 'signup-isolation-privacy-v1') as privacy`,
    );
    assert.deepEqual(identityState.rows[0], {
      contact_emails: "2",
      member_emails: "0",
      verified_emails: "0",
      link_attempts: "0",
      terms: "2",
      privacy: "2",
    });

    console.log("signup-auth-isolation -> hostile-origin rejection plus connect/skip durability and unverified-email checks passed");
  } catch (error) {
    if (serverOutput) console.error("Built server output:\n" + serverOutput.slice(-8_000));
    throw error;
  } finally {
    await stopServer();
    await database?.end().catch(() => undefined);
    await admin.query(`drop database if exists ${databaseName} with (force)`).catch(() => undefined);
    await admin.end();
  }
}

async function applyCreativeMigrations(target: Pool): Promise<void> {
  const directory = path.join(process.cwd(), "drizzle");
  const files = (await readdir(directory)).filter((file) => /^\d{4}.*\.sql$/.test(file)).sort();
  for (const file of files) await target.query(await readFile(path.join(directory, file), "utf8"));
}

async function availablePort(): Promise<number> {
  const listener = createServer();
  listener.listen(0, "127.0.0.1");
  await once(listener, "listening");
  const address = listener.address();
  assert.ok(address && typeof address === "object");
  const port = address.port;
  listener.close();
  await once(listener, "close");
  return port;
}

async function waitForServer(url: string): Promise<void> {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (server?.exitCode !== null) throw new Error(`Built server exited before readiness with code ${server?.exitCode}`);
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.status === 200) return;
    } catch {
      // Startup connection refusals are expected until Next begins listening.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Timed out waiting for the built signup test server");
}

async function postSignup(port: number, origin: string, body: object): Promise<Response> {
  return fetch(`http://127.0.0.1:${port}/api/public/signup`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/json",
      origin,
    },
    body: JSON.stringify(body),
  });
}

function assertPrivate(response: Response): void {
  const cacheControl = new Set(
    (response.headers.get("cache-control") ?? "")
      .split(",")
      .map((directive) => directive.trim()),
  );
  for (const directive of ["private", "no-store", "max-age=0", "must-revalidate"]) {
    assert.equal(cacheControl.has(directive), true, `missing cache-control directive: ${directive}`);
  }
  assert.equal(response.headers.get("cdn-cache-control"), "no-store");
  assert.equal(response.headers.get("surrogate-control"), "no-store");
  assert.match(response.headers.get("vary") ?? "", /Cookie/);
}

async function coreCounts(target: Pool): Promise<{ parents: number; children: number; members: number; consents: number }> {
  const result = await target.query<{ parents: number; children: number; members: number; consents: number }>(
    `select
       (select count(*)::int from parents) as parents,
       (select count(*)::int from children) as children,
       (select count(*)::int from member_accounts) as members,
       (select count(*)::int from member_consents) as consents`,
  );
  return result.rows[0]!;
}

function captureServerOutput(chunk: Buffer): void {
  serverOutput = (serverOutput + chunk.toString()).slice(-16_000);
}

async function stopServer(): Promise<void> {
  if (!server || server.exitCode !== null) return;
  server.kill("SIGTERM");
  await Promise.race([
    once(server, "exit"),
    new Promise<void>((resolve) => setTimeout(resolve, 5_000)),
  ]);
  if (server.exitCode === null) {
    server.kill("SIGKILL");
    await once(server, "exit").catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
