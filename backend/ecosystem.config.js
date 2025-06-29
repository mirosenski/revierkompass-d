module.exports = {
  apps: [{
    name: 'revierkompass-backend',
    script: 'npm',
    args: 'run dev',
    instances: 1,
    autorestart: true,
    watch: process.env.NODE_ENV === 'development',
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    // Automatischer Neustart bei Fehlern
    max_restarts: 10,
    min_uptime: '10s',
    // Health Check
    health_check_grace_period: 3000,
    health_check_fatal_exceptions: true
  }]
}; 