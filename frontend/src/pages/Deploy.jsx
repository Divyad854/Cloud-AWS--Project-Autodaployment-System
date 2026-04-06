// src/pages/Deploy.jsx
import { useState } from 'react';
import { deployProject, getProject } from '../api';
import { Github, Upload, Rocket, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/deploy.css';

/**
 * Supported runtimes (Frontend, Backend, Frameworks, Languages)
 */
const RUNTIMES = [
  // Frontend
  'Static HTML/CSS/JS',
  'React',
  'Next.js',
  'Vue.js',
  'Nuxt.js',
  'Angular',
  'Svelte',
  'SvelteKit',

  // Node.js / JavaScript
  'Node.js',
  'Express.js',
  'NestJS',
  'Fastify',

  // Python
  'Python',
  'Django',
  'Django REST Framework',
  'Flask',
  'FastAPI',

  // Java
  'Java',
  'Spring Boot',

  // .NET
  '.NET',
  '.NET Core',
  'ASP.NET Core',

  // PHP
  'PHP',
  'Laravel',
  'Symfony',

  // Ruby
  'Ruby',
  'Ruby on Rails',

  // Go
  'Go',
  'Gin (Go)',
  'Fiber (Go)',

  // Rust
  'Rust',
  'Rocket (Rust)',
  'Actix (Rust)',

  // Others
  'WordPress',
  'Strapi',
  'Ghost',

  // Custom / Advanced
  'Docker (Custom)',
];

export default function Deploy() {
  const [source, setSource] = useState('github');
  const [form, setForm] = useState({
    name: '',
    runtime: 'Node.js',
    githubUrl: '',
    branch: 'main',
    port: '3000',
  });

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [deploymentStatus, setDeploymentStatus] = useState('');
  const [deploymentMessage, setDeploymentMessage] = useState('');

  const pollProjectStatus = async (id) => {
    try {
      setDeploymentStatus('checking');
      const response = await getProject(id);
      const status = response?.data?.project?.status || 'unknown';
      setDeploymentStatus(status);
    } catch (err) {
      setDeploymentStatus('error');
      setDeploymentMessage('Unable to fetch status yet. Please refresh in a moment.');
    }
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: form.name,
        runtime: form.runtime,
        source,
        port: Number(form.port) || 3000,
      };

      if (source === 'github') {
        payload.githubUrl = form.githubUrl;
        payload.branch = form.branch;
      } else {
        if (!file) {
          toast.error('Please upload a ZIP file');
          setLoading(false);
          return;
        }
        payload.zipFileBase64 = await fileToBase64(file);
        payload.zipFileName = file.name;
      }

      const response = await deployProject(payload);
      const id = response?.data?.projectId || response?.data?.id;
      setProjectId(id || '');
      setDeploymentStatus('queued');
      setDeploymentMessage('Deployment queued. Check status below.');
      toast.success('Deployment queued! 🚀');

      if (id) {
        pollProjectStatus(id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Deployment failed');
      setDeploymentMessage(err.response?.data?.message || 'Deployment failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.zip')) {
      setFile(droppedFile);
    } else {
      toast.error('Please upload a ZIP file');
    }
  };

  return (
    <div className="deploy-page">
      <div className="deploy-card">
        <div className="deploy-header">
          <Rocket size={28} />
          <h2>Deploy New Project</h2>
        </div>

        <form onSubmit={handleSubmit} className="deploy-form">
          {/* Project Details */}
          <div className="form-section">
            <h3>Project Details</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="my-awesome-app"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Runtime *</label>
                <select
                  value={form.runtime}
                  onChange={(e) => setForm({ ...form, runtime: e.target.value })}
                >
                  {RUNTIMES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group half">
              <label>Port</label>
              <input
                type="number"
                placeholder="3000"
                value={form.port}
                onChange={(e) => setForm({ ...form, port: e.target.value })}
              />
            </div>
          </div>

          {/* Source Code */}
          <div className="form-section">
            <h3>Source Code</h3>

            <div className="source-tabs">
              <button
                type="button"
                className={`source-tab ${source === 'github' ? 'active' : ''}`}
                onClick={() => setSource('github')}
              >
                <Github size={18} /> GitHub Repository
              </button>

              <button
                type="button"
                className={`source-tab ${source === 'zip' ? 'active' : ''}`}
                onClick={() => setSource('zip')}
              >
                <Upload size={18} /> Upload ZIP
              </button>
            </div>

            {source === 'github' ? (
              <div className="form-row">
                <div className="form-group">
                  <label>GitHub Repository URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://github.com/username/repo"
                    value={form.githubUrl}
                    onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                  />
                </div>

                <div className="form-group half">
                  <label>Branch</label>
                  <input
                    type="text"
                    placeholder="main"
                    value={form.branch}
                    onChange={(e) => setForm({ ...form, branch: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <div
                className={`drop-zone ${dragOver ? 'drag-over' : ''} ${
                  file ? 'has-file' : ''
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('zip-input').click()}
              >
                <input
                  id="zip-input"
                  type="file"
                  accept=".zip"
                  hidden
                  onChange={(e) => setFile(e.target.files[0])}
                />

                <Upload size={36} />

                {file ? (
                  <>
                    <p className="file-name">{file.name}</p>
                    <p className="muted">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <p>Drop your ZIP file here</p>
                    <p className="muted">or click to browse</p>
                  </>
                )}
              </div>
            )}
          </div>

          <button type="submit" className="btn-deploy" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner-sm" /> Deploying...
              </>
            ) : (
              <>
                <Rocket size={18} /> Deploy Now <ChevronRight size={18} />
              </>
            )}
          </button>
        </form>

        {projectId && (
          <div className="deploy-result-card">
            <h3>Deployment status</h3>
            <p><strong>Project ID:</strong> {projectId}</p>
            <p><strong>Status:</strong> {deploymentStatus}</p>
            {deploymentMessage && <p>{deploymentMessage}</p>}
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className="deploy-info">
        <h3>How it works</h3>

        <div className="steps">
          {[
            { n: 1, title: 'Submit Code', desc: 'Provide a GitHub URL or upload a ZIP file' },
            { n: 2, title: 'Queue', desc: 'Lambda uploads source to S3 and sends a message to SQS' },
            { n: 3, title: 'Build', desc: 'EC2 worker consumes the queue and builds your project' },
            { n: 4, title: 'Live', desc: 'Access your app via the generated public URL' },
          ].map(({ n, title, desc }) => (
            <div key={n} className="step">
              <div className="step-num">{n}</div>
              <div>
                <strong>{title}</strong>
                <p>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}