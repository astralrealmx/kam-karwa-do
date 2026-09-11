// Kept in its own file (no Prisma / server-only imports) so it can be
// safely imported from Edge middleware as well as from the Node-runtime
// session module.
export const SESSION_COOKIE = "kkd_session";
