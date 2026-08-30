module.exports = {
  apps: [
    {
      name: "mesurage-app",
      script: "./src/server.js",
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 3000,
      env: { NODE_ENV: "production" },
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      time: true,
    },
  ],
};