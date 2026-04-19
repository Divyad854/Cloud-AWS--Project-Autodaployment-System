module.exports = {
  apps: [
    {
      name: 'runtime-server',
      script: './server.js',
      cwd: './infra/runtime-manager',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
      },
      error_file: './logs/runtime-server-error.log',
      out_file: './logs/runtime-server-out.log',
    },
    {
      name: 'deploy-worker',
      script: './worker.js',
      cwd: './infra/runtime-manager',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/deploy-worker-error.log',
      out_file: './logs/deploy-worker-out.log',
    },
  ],
};
