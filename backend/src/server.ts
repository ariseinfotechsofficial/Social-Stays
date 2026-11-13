import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDb, disconnectDb } from "./db.js";
import { startJobs } from "./jobs.js";

async function main() {
  await connectDb();
  const app = createApp();
  const server = app.listen(env.PORT, () => console.info(`[api] listening on ${env.PUBLIC_URL} (port ${env.PORT})`));

  const jobs = startJobs();

  const shutdown = () => {
    clearInterval(jobs);
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
