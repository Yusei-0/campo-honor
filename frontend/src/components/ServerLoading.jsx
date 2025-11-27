import React from 'react';
import './ServerLoading.css';

const ServerLoading = () => {
  return (
    <div className="server-loading-overlay">
      <div className="server-loading-content">
        <div className="loading-spinner"></div>
        <h2 className="loading-title">Summoning the Server</h2>
        <p className="loading-subtitle">
          The game server is waking up from its slumber. This may take up to a minute if it has been inactive.
        </p>
        <p className="loading-hint">Please wait while we prepare the battlefield...</p>
      </div>
    </div>
  );
};

export default ServerLoading;
