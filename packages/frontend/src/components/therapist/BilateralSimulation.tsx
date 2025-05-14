import React, { useState, useEffect, useRef } from 'react';

interface BilateralSimulationProps {
  active: boolean;
  speed: number; // Speed in milliseconds per cycle
  direction: 'horizontal' | 'vertical' | 'diagonal';
  onSpeedChange?: (speed: number) => void;
  onDirectionChange?: (direction: 'horizontal' | 'vertical' | 'diagonal') => void;
}

const BilateralSimulation: React.FC<BilateralSimulationProps> = ({
  active = false,
  speed = 1000,
  direction = 'horizontal',
  onSpeedChange,
  onDirectionChange
}) => {
  const [position, setPosition] = useState(0);
  const [isRunning, setIsRunning] = useState(active);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Control the movement of the stimulus
  useEffect(() => {
    if (!isRunning) return;
    
    const intervalId = setInterval(() => {
      setPosition(prev => {
        // Calculate next position based on current position
        // For simplicity, oscillate between 0 and 100
        if (prev >= 100) return 0;
        return prev + 5; // Step size
      });
    }, speed / 20); // Divide by 20 to make the movement smoother
    
    return () => clearInterval(intervalId);
  }, [isRunning, speed]);
  
  // Update isRunning when active prop changes
  useEffect(() => {
    setIsRunning(active);
  }, [active]);
  
  const handleToggle = () => {
    setIsRunning(prev => !prev);
  };
  
  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpeed = parseInt(e.target.value);
    if (onSpeedChange) {
      onSpeedChange(newSpeed);
    }
  };
  
  const handleDirectionChange = (newDirection: 'horizontal' | 'vertical' | 'diagonal') => {
    if (onDirectionChange) {
      onDirectionChange(newDirection);
    }
  };
  
  // Calculate stimulus position based on direction
  const getStimulusStyle = () => {
    // Calculate position based on direction
    switch (direction) {
      case 'horizontal':
        return {
          left: `${position}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)'
        };
      case 'vertical':
        return {
          top: `${position}%`,
          left: '50%',
          transform: 'translate(-50%, -50%)'
        };
      case 'diagonal':
        return {
          top: `${position}%`,
          left: `${position}%`,
          transform: 'translate(-50%, -50%)'
        };
      default:
        return {
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        };
    }
  };
  
  return (
    <div className="w-full h-full p-3">
      <div className="mb-2 flex justify-between items-center">
        <h3 className="text-sm font-medium text-[var(--color-earth)]">Bilateral Stimulation</h3>
        <button
          onClick={handleToggle}
          className={`px-3 py-1 text-xs rounded transition-all ${
            isRunning 
              ? 'bg-[var(--color-clay)] text-white' 
              : 'bg-[var(--color-sage)] text-white'
          }`}
        >
          {isRunning ? 'Stop' : 'Start'}
        </button>
      </div>
      
      {/* Stimulus container */}
      <div className="bilateral-container">
        <div className="bilateral-bg"></div>
        <div 
          ref={containerRef}
          className="relative flex-1 rounded-lg mb-2 overflow-hidden"
          style={{ minHeight: "180px" }}
        >
          <div className="bilateral-dot" style={getStimulusStyle()}></div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="space-y-3 mt-2">
        {/* Speed control */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Speed: {speed}ms
          </label>
          <input
            type="range"
            min="500"
            max="2000"
            step="100"
            value={speed}
            onChange={handleSpeedChange}
            className="w-full h-2 bg-[var(--bg-secondary)] rounded-lg appearance-none cursor-pointer accent-[var(--color-clay)]"
          />
        </div>
        
        {/* Direction control */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Direction
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => handleDirectionChange('horizontal')}
              className={`px-2 py-1 text-xs rounded transition-all ${
                direction === 'horizontal' 
                  ? 'bg-[var(--color-clay)] text-white' 
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
              }`}
            >
              Horizontal
            </button>
            <button
              onClick={() => handleDirectionChange('vertical')}
              className={`px-2 py-1 text-xs rounded transition-all ${
                direction === 'vertical' 
                  ? 'bg-[var(--color-clay)] text-white' 
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
              }`}
            >
              Vertical
            </button>
            <button
              onClick={() => handleDirectionChange('diagonal')}
              className={`px-2 py-1 text-xs rounded transition-all ${
                direction === 'diagonal' 
                  ? 'bg-[var(--color-clay)] text-white' 
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
              }`}
            >
              Diagonal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BilateralSimulation;