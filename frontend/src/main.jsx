// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import awsConfig from './aws-config';
import App from './App';
import './styles/global.css';

Amplify.configure(awsConfig);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
