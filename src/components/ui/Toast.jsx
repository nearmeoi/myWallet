import React, { useState, useEffect } from 'react';
import { Check, Info } from 'lucide-react';

const Toast = ({ message, type, onClose }) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  useEffect(() => {
    if (!isDragging) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [onClose, isDragging]);

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    if (diff > 0) { // Only allow swipe right
      setTranslateX(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (translateX > 100) { // Dismiss threshold
      onClose();
    } else {
      setTranslateX(0); // Reset position
    }
  };

  return (
    <div 
      className="toast"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateX(${translateX}px)`,
        opacity: 1 - (translateX / 200),
        transition: isDragging ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
        cursor: 'grab'
      }}
    >
      <div style={{
        width: '32px', height: '32px', borderRadius: '4px', border: '2px solid #1A1D1E',
        background: type === 'success' ? '#D4F7E6' : type === 'error' ? '#FFC0C0' : '#BBEFFA',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        {type === 'success' ? <Check size={18} /> : <Info size={18} />}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '14px', fontWeight: '700' }}>{type === 'success' ? 'Sukses!' : type === 'error' ? 'Error' : 'Info'}</p>
        <p style={{ fontSize: '13px', fontWeight: '500' }}>{message}</p>
      </div>
    </div>
  );
};

export default Toast;
