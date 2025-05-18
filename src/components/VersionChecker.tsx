import { useEffect, useState } from 'react';

const VersionChecker = () => {
  const [showUpdateNotice, setShowUpdateNotice] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const response = await fetch('/version.json', { cache: 'no-cache' });
        const data = await response.json();

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
    <div className="fixed bottom-4 right-4 bg-yellow-200 border border-yellow-500 text-yellow-800 px-4 py-2 rounded shadow">
      🔄 New version available.{' '}
      <button
        className="underline font-semibold"
        onClick={() => window.location.reload()}
      >
        Reload
      </button>
    </div>
  );
};

export default VersionChecker;
