import React from 'react';
import { Github } from 'lucide-react';
import './WelcomeScreen.css';

const WelcomeScreen = ({ onLogin, onContinueWithoutLogin }) => {
  return (
    <div className="welcome-container">
      <div className="welcome-card">
        <div className="welcome-header">
          <div className="welcome-icon">
            <Github className="icon-github" />
          </div>
          <h1 className="welcome-title">DevLens</h1>
          <p className="welcome-subtitle">SPL Code Evaluation Assistant</p>
        </div>

        <div className="welcome-buttons">
          <button
            onClick={onLogin}
            className="btn btn-primary"
          >
            Log in
          </button>
          
          <button
            onClick={onContinueWithoutLogin}
            className="btn btn-secondary"
          >
            Anonymous
          </button>
        </div>

        <p className="welcome-footer-text">
          Logging in saves your data until semester end
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;