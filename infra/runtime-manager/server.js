// infra/runtime-manager/server.js
// Lightweight Express server running on EC2 to manage Docker containers
const express = require('express');
const { execSync, exec } = require('child_process');
const app = express();
app.use(express.json());

// Only allow requests from backend Lambda/API server (add IP restriction in production)
app.use((req, res, next) => {
  // TODO: Restrict to backend server IP
  next();
});

// Run a new container
app.post('/container/run', (req, res) => {
  const { projectId, image, port } = req.body;
  if (!projectId || !image || !port) return res.status(400).json({ error: 'Missing params' });

  const name = `app_${projectId}`;
  try {
    // Stop existing if any
    try { execSync(`docker stop ${name} && docker rm ${name}`); } catch {}
    // Run new container
    execSync(`docker run -d --name ${name} -p ${port}:${port} \
      --restart unless-stopped \
      --log-driver awslogs \
      --log-opt awslogs-region=${process.env.AWS_REGION || 'us-east-1'} \
      --log-opt awslogs-group=/cloudlaunch/containers \
      --log-opt awslogs-stream=${projectId} \
      ${image}`);
    res.json({ message: 'Container started', port });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stop container
app.post('/container/stop/:projectId', (req, res) => {
  const name = `app_${req.params.projectId}`;
  try {
    execSync(`docker stop ${name}`);
    res.json({ message: 'Stopped' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restart container
app.post('/container/restart/:projectId', (req, res) => {
  const name = `app_${req.params.projectId}`;
  try {
    execSync(`docker restart ${name}`);
    res.json({ message: 'Restarted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  const containers = execSync('docker ps --format "{{.Names}}" 2>/dev/null || echo ""').toString().trim();
  res.json({ status: 'ok', containers: containers.split('\n').filter(Boolean) });
});

app.listen(8080, () => console.log('Runtime manager running on :8080'));
