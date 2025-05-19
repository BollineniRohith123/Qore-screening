import React, { useState, useEffect } from 'react';

interface ScreeningTimerProps {
  isActive: boolean;
  maxDuration: number; // in seconds
  onTimeUp?: () => void;
}

const ScreeningTimer: React.FC<ScreeningTimerProps> = ({ 
  isActive, 
  maxDuration, 
  onTimeUp 
}) => {
  const [timeRemaining, setTimeRemaining] = useState(maxDuration);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isActive && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            onTimeUp && onTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isActive) {
      setTimeRemaining(maxDuration);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, timeRemaining, maxDuration, onTimeUp]);
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate percentage for progress bar
  const progressPercentage = (timeRemaining / maxDuration) * 100;
  
  return (
    <div className="mt-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm text-white">Screening Time</span>
        <span className="text-sm text-white font-medium">{formatTime(timeRemaining)}</span>
      </div>
      <div className="w-full h-2 bg-[#333333] rounded-full overflow-hidden">
        <div 
          className="h-full bg-[rgb(147,112,219)] transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ScreeningTimer;