import React, { useState, useEffect } from 'react';
import { SOCKET_URL } from '../config';
import ServerLoading from './ServerLoading';

const ServerAwakener = ({ children }) => {
  const [isServerReady, setIsServerReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check for "secret" test route
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('test-loader') === 'true') {
      // Force loading state forever for testing
      return;
    }

    const checkServerHealth = async () => {
      try {
        // Use fetch to ping the health endpoint
        // We use the HTTP URL derived from SOCKET_URL
        // If SOCKET_URL is just the base domain, we append /health
        const healthUrl = `${SOCKET_URL.replace(/\/$/, '')}/health`;
        
        const response = await fetch(healthUrl);
        if (response.ok) {
          setIsServerReady(true);
        } else {
          // If response is not ok, retry after delay
          setTimeout(checkServerHealth, 2000);
        }
      } catch (err) {
        // Network error (server likely down/waking up), retry
        console.log("Waiting for server...", err);
        setTimeout(checkServerHealth, 2000);
      }
    };

    checkServerHealth();
  }, []);

  if (!isServerReady) {
    return <ServerLoading />;
  }

  return children;
};

export default ServerAwakener;
