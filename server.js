// Production entry point for Hostinger Node.js Web Apps (and any Node host that
// expects a server file rather than a "next start" command). Runs the already-
// built Next.js app: SSR pages, API routes, middleware, and static assets are
// all served through Next's request handler. Listens on the host-assigned PORT.
//
// Deploy config on Hostinger:
//   Install command: npm install
//   Build command:   npm run build
//   Entry file:      server.js      (or Start command: node server.js)
//   Node version:    20.x
const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const host = process.env.HOST || "0.0.0.0";
const app = next({ dev: false });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = createServer((req, res) => handle(req, res));
    server.on("error", (err) => {
      console.error("Server error:", err);
      process.exit(1);
    });
    server.listen(port, host, () => {
      console.log(`> SCCC ready on http://${host}:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
