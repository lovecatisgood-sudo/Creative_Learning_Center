// PM2 process definition for the Hostinger VPS (see DEPLOY.md).
// Runs `next start` on port 3000 behind Nginx; loads env from .env.
module.exports = {
  apps: [
    {
      name: "sccc",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
