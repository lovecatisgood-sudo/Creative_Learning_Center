export function isMemberSchemaReady(): boolean {
  return process.env.MEMBER_SCHEMA_READY === "1";
}
