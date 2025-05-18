import { useEffect, useState } from 'react';
import './VersionChecker.css';

const VersionChecker = () => {
  const [showUpdateNotice, setShowUpdateNotice] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const response = await fetch('/version.json', { cache: 'no-cache' });
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (jsonErr) {
          // If not JSON, probably got an HTML error page (e.g., 404)
          console.error('version.json is not valid JSON:', text);
          return;
        }

        if (!currentVersion) {
          setCurrentVersion(data.version);
        } else if (data.version !== currentVersion) {
          setShowUpdateNotice(true);
        }
      } catch (err) {
        console.error('Error checking version:', err);
      }
    };

    const interval = setInterval(checkVersion, 10000); // every 10s
    checkVersion(); // initial

    return () => clearInterval(interval);
  }, [currentVersion]);

  if (!showUpdateNotice) return null;

  return (
    <div className="version-checker-notice">
      <span className="version-checker-icon" role="img" aria-label="update">🔄</span>
      <span className="version-checker-text">
        New version available.
      </span>
      <button
        className="version-checker-reload"
        onClick={() => window.location.reload()}
      >
        Reload
      </button>
    </div>
  );
};

export default VersionChecker;
