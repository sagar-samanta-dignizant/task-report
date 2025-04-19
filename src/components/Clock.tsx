import { useEffect, useState } from "react";

const Clock = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
  
    useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer); // Cleanup timer on component unmount
    }, []);
  
    return (
      <div className="clock">
        {currentTime.toLocaleTimeString()} {/* Show only the time */}
      </div>
    );
  };
  export default Clock;