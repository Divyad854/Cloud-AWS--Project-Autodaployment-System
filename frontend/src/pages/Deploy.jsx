// src/pages/Deploy.jsx

import { useState, useEffect } from 'react';
import { deployProject, getProject } from '../api';
import { Github, Rocket, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/deploy.css';

// 🔥 ADD AWS SDK
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

/**
 * 🔥 AWS CONFIG (PUT YOUR KEYS HERE)
 */


const client = new DynamoDBClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "---",
  secretAccessKey: "---",
  },
});

const dynamo = DynamoDBDocumentClient.from(client);


/**
 * Supported runtimes
 */
const RUNTIMES = ['Node.js', 'Python', 'Java'];

export default function Deploy() {
  const [currentProcess, setCurrentProcess] = useState(null);
  const source = 'github';

  const updatePortInEnv = (portValue) => {
    const lines = form.env
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const portIndex = lines.findIndex((line) =>
      line.toUpperCase().startsWith('PORT=')
    );

    if (portIndex >= 0) {
      if (portValue) {
        lines[portIndex] = `PORT=${portValue}`;
      } else {
        lines.splice(portIndex, 1);
      }
    } else if (portValue) {
      lines.unshift(`PORT=${portValue}`);
    }

    return lines.join('\n');
  };

  const [form, setForm] = useState({
    name: '',
    runtime: 'Node.js',
    githubUrl: '',
    branch: 'main',
    port: '5000',
    env: 'PORT=5000',
  });

  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [deploymentStatus, setDeploymentStatus] = useState('');
  const [deploymentMessage, setDeploymentMessage] = useState('');
  const [deployUrl, setDeployUrl] = useState('');

  // 🔥 NEW STATE (FOR ALL PROJECTS FROM DB)
  const [allProjects, setAllProjects] = useState([]);

  // 🔥 DIRECT DYNAMODB FETCH + LIVE SYNC
useEffect(() => {
  const fetchProjects = async () => {
    try {
      const data = await dynamo.send(
        new ScanCommand({
          TableName: "deploy-projects",
        })
      );

      const items = data.Items || [];
      setAllProjects(items);

      // ✅ IMPORTANT: Sync progress bar with DB
      if (currentProcess) {
        const updated = items.find(
          (p) => p.projectid === currentProcess.projectid
        );

        if (updated) {
          setCurrentProcess({
            projectid: updated.projectid,
            status: updated.status,
            deployUrl: updated.deployUrl,
          });
        }
      }

    } catch (err) {
      console.error("Dynamo Error:", err);
    }
  };

  // first load
  fetchProjects();

  // auto refresh every 2 sec
  const interval = setInterval(fetchProjects, 2000);

  return () => clearInterval(interval);
}, [currentProcess]);


// 🔥 AUTO POLLING (API BASED)
useEffect(() => {
  if (!projectId) return;

  const interval = setInterval(async () => {
    try {
      const response = await getProject(projectId);
      const data = response?.data;

      if (!data) return;

      setDeploymentStatus(data.status || 'unknown');

      if (data.status === 'running') {
        setDeployUrl(data.deployUrl);
        setDeploymentMessage('Deployment completed 🚀');
        clearInterval(interval);
        toast.success('Deployment completed 🚀');
      }

      if (data.status === 'failed') {
        setDeploymentMessage('Deployment failed ❌');
        clearInterval(interval);
        toast.error('Deployment failed ❌');
      }

      if (data.status) {
        setCurrentProcess({
          projectid: projectId,
          status: data.status,
          deployUrl: data.deployUrl
        });
      }

      if (data.status === "running") {
        setTimeout(() => {
          setCurrentProcess(null);
        }, 10000);
      }

    } catch (err) {
      console.error(err);
    }
  }, 3000);

  return () => clearInterval(interval);
}, [projectId]);

// 🔥 SUBMIT
const handleSubmit = async (e) => {
  e.preventDefault();

  if (loading) return;

  setLoading(true);

  try {
    const payload = {
      name: form.name,
      runtime: form.runtime,
      source,
      githubUrl: form.githubUrl,
      branch: form.branch,
      port: Number(form.port) || 5000,
      env: form.env,
    };

    const response = await deployProject(payload);

    // ✅ GET PROJECT ID FIRST
    const id = response?.data?.projectId || response?.data?.id;

    // ✅ SAVE PROJECT ID
    localStorage.setItem("projectId", id);

    // ✅ REDIRECT TO LOGS
    window.location.href = "/app/logs";

    // (optional UI updates — will not matter after redirect)
    setProjectId(id || '');
    setCurrentProcess({
      projectid: id,
      status: "queued",
      deployUrl: null
    });

    setDeploymentStatus('queued');
    setDeploymentMessage('Deployment started... 🚀');
    setDeployUrl('');

    toast.success('Deployment started 🚀');

  } catch (err) {
    toast.error(err.response?.data?.message || 'Deployment failed');
    setDeploymentMessage(err.response?.data?.message || 'Deployment failed.');
  } finally {
    setLoading(false);
  }
};
  return (
  <div className="deploy-page">

    {/* 🔥 ONLY CURRENT PROJECT PROCESS */}
  {/* 🔥 PROCESS / IDLE UI */}
<div className="process-container">

  {currentProcess ? (
    <div className="process-card">

      <div className="process-header">
        <h4>{currentProcess.projectid}</h4>
        <span className={`status ${currentProcess.status}`}>
          {currentProcess.status}
        </span>
      </div>
<div className="process-bar">
  <span className={currentProcess.status === "queued" ? "active" : ""}>
    Queued
  </span>
  <span className={currentProcess.status === "building" ? "active" : ""}>
    Building
  </span>
  <span className={currentProcess.status === "running" ? "active success" : ""}>
    Running
  </span>
  <span className={currentProcess.status === "failed" ? "active fail" : ""}>
    Failed
  </span>
</div>

{/* ✅ URL with spacing + blue clickable */}
{currentProcess.status === "running" && currentProcess.deployUrl && (
  <div className="deploy-url">
    <a
      href={currentProcess.deployUrl}
      target="_blank"
      rel="noreferrer"
      className="deploy-link"
    >
      {currentProcess.deployUrl}
    </a>
  </div>
)}

    </div>
  ) : (
    /* 🔥 IDLE STATE UI */
  <div className="deploy-steps">
  <div className="step active">
    <span>1</span>
    <p>Enter project Details</p>
  </div>

  <div className="step">
    <span>2</span>
    <p>Click Deploy</p>
  </div>

  <div className="step">
    <span>3</span>
    <p>Build Automaticly</p>
  </div>

  <div className="step">
    <span>4</span>
    <p>Live URL 🚀</p>
  </div>
</div>
  )}

</div>

    {/* ================= FORM ================= */}
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
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group half">
            <label>Project Backend Port</label>
            <input
              type="number"
              placeholder="5000"
              value={form.port}
              onChange={(e) => {
                const nextPort = e.target.value;
                setForm({
                  ...form,
                  port: nextPort,
                  env: updatePortInEnv(nextPort),
                });
              }}
            />
          </div>
        </div>

        {/* Source Code */}
        <div className="form-section">
          <h3>Source Code</h3>

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

          <div className="form-group">
            <label>Environment Variables</label>
            <textarea
              rows={4}
              placeholder={`PORT=5000\nMONGO_URI=...`}
              value={form.env}
              onChange={(e) => setForm({ ...form, env: e.target.value })}
            />
          </div>
        </div>

        <button type="submit" className="btn-deploy" disabled={loading}>
          {loading ? 'Deploying...' : 'Deploy Now'}
        </button>
      </form>
      {/* RESULT */}
    

    </div> {/* ✅ deploy-card end */}

{/* 📘 HOW TO FILL PROJECT DETAILS */}
<div className="deploy-info">

  <h3>How to Fill Project Details</h3>

  <div className="project-card">

    <div className="project-header">
      <h4>Example Project</h4>
    </div>

    <div className="project-body">

      <p><strong>Project Name:</strong> my-awesome-app</p>

      <p><strong>Runtime:</strong> Node.js</p>

      <p><strong>Port:</strong> 5000</p>

      <p><strong>GitHub URL:</strong> https://github.com/abc12/studentmanagement</p>

      <p><strong>Branch:</strong> main</p>

      <p><strong>Environment Variables:</strong></p>
      <pre>
PORT=5000
MONGO_URI=mongodb+srv://abc:abc%40%2312@cluster0.yptpqkn.mongodb.net/javaDb?retryWrites=true&w=majority
      </pre>

    </div>

  </div>

</div>


  </div>
);
}