module.exports = {
  apps: [
    {
      name: "mesurage-app",
      script: "./src/server.js",
      autorestart: true,
      watch: false,
      env: { NODE_ENV: "production" },
    },
  ],
};