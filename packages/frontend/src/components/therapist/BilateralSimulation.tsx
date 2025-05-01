// packages/frontend/src/components/therapist/BilateralSimulation.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from '../../context/SessionContext';

const BilateralStimulation: React.FC = () => {
  const {
    bilateralActive,
    toggleBilateralStimulation,
    setBilateralSpeed
  } = useSession();
  
  // State for visualization
  const [currentPosition, setCurrentPosition] = useState(0);
  const [direction, setDirection] = useState<'right' | 'left'>('right');
  const [isFlashing, setIsFlashing] = useState({
    left: false,
    right: false
  });

  // Settings
  const [settings, setSettings] = useState({
    speed: 0.5,
    leftColor: '#FFD700', // Golden yellow
    rightColor: '#00BFFF', // Deep sky blue
  });

  // Refs for animation and measurements
  const animationFrameRef = useRef<number | null>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  // Smooth animation handler
  const animateStimulation = useCallback(() => {
    if (!bilateralActive || !lineRef.current || !dotRef.current) return;

    const lineElement = lineRef.current;
    const dotElement = dotRef.current;
    
    // Calculate available movement space
    const lineWidth = lineElement.offsetWidth - dotElement.offsetWidth;
    const maxTravel = lineWidth * 1;

    setCurrentPosition(prev => {
      const speedAdjustment = settings.speed * 5;
      let newPos = direction === 'right' 
        ? prev + speedAdjustment 
        : prev - speedAdjustment;
      
      // Change direction at endpoints with flash
      if (newPos >= maxTravel) {
        setDirection('left');
        newPos = maxTravel;
        // Flash right endpoint
        setIsFlashing(prev => ({ ...prev, right: true }));
        setTimeout(() => {
          setIsFlashing(prev => ({ ...prev, right: false }));
        }, 150);
      } else if (newPos <= 0) {
        setDirection('right');
        newPos = 0;
        // Flash left endpoint
        setIsFlashing(prev => ({ ...prev, left: true }));
        setTimeout(() => {
          setIsFlashing(prev => ({ ...prev, left: false }));
        }, 150);
      }

      return newPos;
    });

    animationFrameRef.current = requestAnimationFrame(animateStimulation);
  }, [bilateralActive, settings.speed, direction]);

  // Animation effect management
  useEffect(() => {
    if (bilateralActive) {
      animationFrameRef.current = requestAnimationFrame(animateStimulation);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setCurrentPosition(0);
      setDirection('right');
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [bilateralActive, animateStimulation]);

  // Update session context when settings change
  useEffect(() => {
    setBilateralSpeed(settings.speed);
  }, [settings.speed, setBilateralSpeed]);

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold text-center mb-6">Bilateral Stimulation</h1>
      
      {/* Visual stimulation - main visualization */}
      <div className="w-full h-24 my-6 relative flex items-center justify-center">
        {/* Left circle */}
        <div 
          className={`w-16 h-16 rounded-full transition-all duration-150 ease-out ${
            isFlashing.left ? 'opacity-100 shadow-2xl' : 'opacity-50'
          }`}
          style={{ 
            backgroundColor: settings.leftColor,
            boxShadow: isFlashing.left 
              ? `0 0 30px 10px ${settings.leftColor}` 
              : 'none'
          }}
        />

        {/* Stationary line container */}
        <div 
          ref={lineRef}
          className="mx-4 h-1 bg-gray-300 flex-grow" 
        >
          {/* Moving dot */}
          <div 
            ref={dotRef}
            className="absolute top-1/2 w-1 h-1 rounded-full bg-gray-400 transform -translate-y-1/2" 
            style={{ 
              left: `calc(${currentPosition}px + ${(16 + 16)}px)`, // Adjust for left circle width and padding
              opacity: 0.3
            }}
          />
        </div>

        {/* Right circle */}
        <div 
          className={`w-16 h-16 rounded-full transition-all duration-150 ease-out ${
            isFlashing.right ? 'opacity-100 shadow-2xl' : 'opacity-50'
          }`}
          style={{ 
            backgroundColor: settings.rightColor,
            boxShadow: isFlashing.right 
              ? `0 0 30px 10px ${settings.rightColor}` 
              : 'none'
          }}
        />
      </div>
      
      {/* Controls section with light blue background */}
      <div className="bg-blue-100 p-6 rounded-lg flex-grow">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <label className="font-medium text-right w-1/3 pr-4">Movement Speed</label>
            <div className="w-2/3 flex items-center">
              <input 
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={settings.speed}
                onChange={(e) => setSettings(prev => ({
                  ...prev, 
                  speed: parseFloat(e.target.value)
                }))}
                className="flex-grow mr-2"
                disabled={bilateralActive}
              />
              <span className="w-24 text-right">{settings.speed.toFixed(1)} units/sec</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="font-medium text-right w-1/3 pr-4">Left Side Color</label>
            <div className="w-2/3">
              <input 
                type="color"
                value={settings.leftColor}
                onChange={(e) => setSettings(prev => ({
                  ...prev, 
                  leftColor: e.target.value
                }))}
                disabled={bilateralActive}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="font-medium text-right w-1/3 pr-4">Right Side Color</label>
            <div className="w-2/3">
              <input 
                type="color"
                value={settings.rightColor}
                onChange={(e) => setSettings(prev => ({
                  ...prev, 
                  rightColor: e.target.value
                }))}
                disabled={bilateralActive}
              />
            </div>
          </div>

          <div className="flex justify-center mt-4">
            <button 
              onClick={toggleBilateralStimulation}
              className="border border-gray-300 bg-gray-100 hover:bg-gray-200 text-black py-2 px-4 rounded"
            >
              {bilateralActive ? 'Stop' : 'Start'} Stimulation
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm">
          Disclaimer: This is a simulation and should not replace professional EMDR therapy.
        </p>
      </div>
    </div>
  );
};

export default BilateralStimulation;