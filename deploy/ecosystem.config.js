module.exports = {
  apps: [
    {
      name: "upsc-frontend",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/frontend",
      instances: 1,
      exec_mode: "fork",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      // Logging
      out_file: "/var/log/pm2/frontend-out.log",
      error_file: "/var/log/pm2/frontend-error.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
