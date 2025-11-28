module.exports = {
  apps: [
    {
      name: "whois-app",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "/var/www/vhosts/ysftsdln.com/httpdocs/whois-rade",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        NEXT_PUBLIC_BASE_PATH: "/whois-rade",
      },
    },
  ],
};
