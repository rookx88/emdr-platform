// packages/frontend/src/components/therapist/BilateralStimulation.tsx
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
      <div className="border-b pb-2 mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Bilateral Stimulation</h3>
        <button
          onClick={toggleBilateralStimulation}
          className={`px-3 py-1 rounded-md text-white ${
            bilateralActive ? 'bg-red-500' : 'bg-green-500'
          }`}
        >
          {bilateralActive ? 'Stop' : 'Start'}
        </button>
      </div>
      
      <div className="flex mb-4 space-x-4">
        <div className="w-1/2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Speed</label>
          <select
            value={bilateralSpeed}
            onChange={e => setBilateralSpeed(parseFloat(e.target.value))}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
        
        <div className="w-1/2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
          <select
            value={bilateralDirection}
            onChange={e => setBilateralDirection(e.target.value as 'horizontal' | 'vertical')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            disabled={bilateralActive}
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </select>
        </div>
      </div>
      
      <div
        ref={containerRef}
        className="flex-1 relative border-2 border-gray-300 rounded-lg bg-gray-50"
      >
        {bilateralDirection === 'horizontal' ? (
          <div
            className="absolute top-1/2 transform -translate-y-1/2 h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center text-white"
            style={{ left: `${position}px` }}
          >
            {directionRef.current > 0 ? '➔' : '⬅'}
          </div>
        ) : (
          <div
            className="absolute left-1/2 transform -translate-x-1/2 h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center text-white"
            style={{ top: `${position}px` }}
          >
            {directionRef.current > 0 ? '⬇' : '⬆'}
          </div>
        )}
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>Click Start to begin bilateral stimulation</p>
        <p>Adjust speed and direction as needed for the client</p>
      </div>
    </div>
  );
};

export default BilateralStimulation;