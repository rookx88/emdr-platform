// packages/frontend/src/components/therapist/BilateralSimulation.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useSession } from '../../context/SessionContext';

const BilateralStimulation: React.FC = () => {
  const {
    bilateralActive,
    bilateralSpeed,
    bilateralDirection,
    toggleBilateralStimulation,
    setBilateralSpeed,
    setBilateralDirection
  } = useSession();
  
  const [position, setPosition] = useState(0);
  const [maxPosition, setMaxPosition] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const directionRef = useRef(1); // 1 for right/down, -1 for left/up
  
  // Speed options (in pixels per frame)
  const speedOptions = [0.5, 1, 2, 3, 5];
  
  // Update max position based on container size
  useEffect(() => {
    if (containerRef.current) {
      const updateMaxPosition = () => {
        if (containerRef.current) {
          if (bilateralDirection === 'horizontal') {
            setMaxPosition(containerRef.current.clientWidth - 50); // Account for dot width
          } else {
            setMaxPosition(containerRef.current.clientHeight - 50); // Account for dot height
          }
        }
      };
      
      updateMaxPosition();
      window.addEventListener('resize', updateMaxPosition);
      
      return () => {
        window.removeEventListener('resize', updateMaxPosition);
      };
    }
  }, [bilateralDirection]);
  
  // Handle animation
  useEffect(() => {
    if (bilateralActive) {
      const animate = () => {
        setPosition(prev => {
          const newPosition = prev + (bilateralSpeed * directionRef.current);
          
          // Change direction if reaching the edges
          if (newPosition >= maxPosition) {
            directionRef.current = -1;
            return maxPosition;
          } else if (newPosition <= 0) {
            directionRef.current = 1;
            return 0;
          }
          
          return newPosition;
        });
        
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [bilateralActive, bilateralSpeed, maxPosition]);
  
  // Reset position when direction changes
  useEffect(() => {
    setPosition(0);
    directionRef.current = 1;
  }, [bilateralDirection]);
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between mb-6">
        <div className="w-1/2 pr-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Speed</label>
          <select
            value={bilateralSpeed}
            onChange={e => setBilateralSpeed(parseFloat(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-md"
            disabled={bilateralActive}
          >
            {speedOptions.map(speed => (
              <option key={speed} value={speed}>
                {speed === 0.5 ? 'Very Slow' : 
                 speed === 1 ? 'Slow' : 
                 speed === 2 ? 'Medium' : 
                 speed === 3 ? 'Fast' : 'Very Fast'}
              </option>
            ))}
          </select>
        </div>
        
        <div className="w-1/2 pl-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
          <select
            value={bilateralDirection}
            onChange={e => setBilateralDirection(e.target.value as 'horizontal' | 'vertical')}
            className="w-full p-2 border border-gray-300 rounded-md"
            disabled={bilateralActive}
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </select>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 border-2 border-gray-300 rounded-lg relative"
        style={{ backgroundColor: '#f8f9fa' }}
      >
        {bilateralDirection === 'horizontal' ? (
          <>
            {/* Visual arrows to show direction */}
            <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none opacity-20">
              <span className="text-2xl">←</span>
              <span className="text-2xl">→</span>
            </div>
            
            {/* Moving dot */}
            <div
              className="absolute top-1/2 transform -translate-y-1/2 h-10 w-10 rounded-full flex items-center justify-center"
              style={{ 
                left: `${position}px`,
                backgroundColor: '#4338ca',
                boxShadow: '0 0 10px rgba(0,0,0,0.3)'
              }}
            >
              <span className="text-white">
                {directionRef.current > 0 ? '→' : '←'}
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Visual arrows to show direction */}
            <div className="absolute inset-0 flex flex-col items-center justify-between py-4 pointer-events-none opacity-20">
              <span className="text-2xl">↑</span>
              <span className="text-2xl">↓</span>
            </div>
            
            {/* Moving dot */}
            <div
              className="absolute left-1/2 transform -translate-x-1/2 h-10 w-10 rounded-full flex items-center justify-center"
              style={{ 
                top: `${position}px`,
                backgroundColor: '#4338ca', 
                boxShadow: '0 0 10px rgba(0,0,0,0.3)'
              }}
            >
              <span className="text-white">
                {directionRef.current > 0 ? '↓' : '↑'}
              </span>
            </div>
          </>
        )}
      </div>
      
      <div className="mt-6 flex justify-center">
        <button
          onClick={toggleBilateralStimulation}
          className={`px-6 py-2 rounded-lg text-white font-medium ${
            bilateralActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {bilateralActive ? 'Stop' : 'Start'} Stimulation
        </button>
      </div>
    </div>
  );
};

export default BilateralStimulation;