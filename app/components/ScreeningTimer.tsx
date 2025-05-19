import React, { useState, useEffect } from 'react';

interface ScreeningTimerProps {
  isActive: boolean;
  duration: number; // duration in seconds
  onTimeWarning: () => void;
  onTimeEnd: () => void;
}

const ScreeningTimer: React.FC<ScreeningTimerProps> = ({ 
  isActive, 
  duration, 
  onTimeWarning,
  onTimeEnd 
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [showWarning, setShowWarning] = useState(false);
  
  // Format seconds to mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          // When 30 seconds left, trigger warning
          if (prevTime === 30) {
            setShowWarning(true);
            onTimeWarning();
          }
          
          // When time is up
          if (prevTime === 1) {
            onTimeEnd();
          }
          
          return prevTime - 1;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      setShowWarning(false);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, timeLeft, onTimeWarning, onTimeEnd]);
  
  // Reset timer when interview becomes active
  useEffect(() => {
    if (isActive) {
      setTimeLeft(duration);
      setShowWarning(false);
    }
  }, [isActive, duration]);
  
  if (!isActive) {
    return null;
  }
  
  // Calculate progress percentage
  const progressPercentage = (timeLeft / duration) * 100;
  
  return (
    <div className="w-full mb-4">
      <div className="flex justify-between items-center mb-1">
        <div className="text-sm font-medium text-white">Screening Timer</div>
        <div className={`text-sm font-bold ${timeLeft <= 30 ? 'text-red-500' : 'text-[rgb(147,112,219)]'}`}>
          {formatTime(timeLeft)}
        </div>
      </div>
      
      <div className="w-full bg-[#2A2A2A] rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${
            timeLeft <= 30 ? 'bg-red-500' : 'bg-[rgb(147,112,219)]'
          }`}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      {showWarning && (
        <div className="mt-2 p-2 bg-red-500 bg-opacity-20 border border-red-500 rounded text-xs text-white">
          <span className="font-bold">⚠️ 30 seconds remaining:</span> The screening will conclude shortly.
        </div>
      )}
    </div>
  );
};

export default ScreeningTimer;
