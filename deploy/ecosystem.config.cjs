/**
 * PM2 config for the API and the website (which also serves the admin at /admin) on one VPS.
 *
 *   cd /srv/social-stays
 *   (cd backend && npm ci && npm run build)
 *   (cd frontend && npm ci && npm run build)   # the API must be running first: pages are built from it
 *   pm2 start deploy/ecosystem.config.cjs && pm2 save
 *
 * Each app reads its own .env / .env.production in its folder.
 */
module.exports = {
  apps: [
    {
      name: "ss-api",
      cwd: "./backend",
      script: "dist/server.js",
      node_args: "--env-file=.env",
      env: { NODE_ENV: "production" },
      max_memory_restart: "400M",
    },
    {
      name: "ss-web",
      cwd: "./frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      env: { NODE_ENV: "production" },
    },
  ],
};
