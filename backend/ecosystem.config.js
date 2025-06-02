module.exports = {
  apps: [{
    name: 'armed-forces-welfare-api',
    script: 'index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    autorestart: true
  }],

  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-production-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/armed-forces-welfare.git',
      path: '/var/www/armed-forces-welfare',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run indexes && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    staging: {
      user: 'ubuntu',
      host: 'your-staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/armed-forces-welfare.git',
      path: '/var/www/armed-forces-welfare-staging',
      'post-deploy': 'npm install && npm run indexes && pm2 reload ecosystem.config.js --env staging'
    }
  }
};
