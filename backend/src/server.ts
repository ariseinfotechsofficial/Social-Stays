import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDb, disconnectDb } from "./db.js";

async function main() {
  await connectDb();
  const app = createApp();
  if (env.isProd && env.uploadsInsideApp) {
    console.warn(`[uploads] UPLOADS_DIR (${env.uploadsDir}) is inside the app folder: photos uploaded in the admin will be DELETED on the next redeploy. Point UPLOADS_DIR at a folder outside the app.`);
  }
  const server = app.listen(env.PORT, () => console.info(`[api] listening on ${env.PUBLIC_URL} (port ${env.PORT})`));

  const shutdown = () => {
    server.close(() => void disconnectDb().then(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
