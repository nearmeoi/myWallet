import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Check } from 'lucide-react';

export default function PullToRefresh({ onRefresh, refreshing, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const pullDistRef = useRef(0);
  const isPullingRef = useRef(false);

  const THRESHOLD = 55;

  const handleTouchStart = (e) => {
    // Only allow pull-to-refresh if page is scrolled to top
    if (window.scrollY > 5 || refreshing) return;

    // Ignore touches that originate from elements marked to disable PTR (like card stack)
    if (e.target && e.target.closest && e.target.closest('[data-no-ptr], [data-card-stack], .no-pull-to-refresh')) {
      isPullingRef.current = false;
      return;
    }

    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    isPullingRef.current = true;
    setIsPulling(true);
  };

  const handleTouchMove = (e) => {
    if (!isPullingRef.current || refreshing) return;

    // Check if scrolled down
    if (window.scrollY > 0) {
      isPullingRef.current = false;
      setIsPulling(false);
      setPullDistance(0);
      pullDistRef.current = 0;
      return;
    }

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = Math.abs(currentX - startXRef.current);
    const diffY = currentY - startYRef.current;

    // If movement is predominantly horizontal, cancel pull-to-refresh immediately
    if (diffX > 8 && diffX > diffY) {
      isPullingRef.current = false;
      setIsPulling(false);
      setPullDistance(0);
      pullDistRef.current = 0;
      return;
    }

    if (diffY > 0) {
      // Damped pull distance
      const dist = Math.min(diffY * 0.45, 80);
      setPullDistance(dist);
      pullDistRef.current = dist;
    } else {
      setPullDistance(0);
      pullDistRef.current = 0;
    }
  };

  const handleTouchEnd = async () => {
    if (!isPullingRef.current || refreshing) {
      setPullDistance(0);
      pullDistRef.current = 0;
      return;
    }
    isPullingRef.current = false;
    setIsPulling(false);

    if (pullDistRef.current >= THRESHOLD && onRefresh) {
      setPullDistance(50);
      try {
        await onRefresh();
        setJustCompleted(true);
        setTimeout(() => {
          setJustCompleted(false);
          setPullDistance(0);
          pullDistRef.current = 0;
        }, 600);
      } catch (err) {
        console.error(err);
        setPullDistance(0);
        pullDistRef.current = 0;
      }
    } else {
      setPullDistance(0);
      pullDistRef.current = 0;
    }
  };

  const isReady = pullDistance >= THRESHOLD;
  const rotation = Math.min(pullDistance * 5, 360);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ position: 'relative', minHeight: '100%' }}
    >
      {/* Pull To Refresh Indicator */}
      <div
        style={{
          height: refreshing ? '54px' : `${pullDistance}px`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: isPulling ? 'none' : 'height 0.25s ease, opacity 0.25s ease',
          opacity: pullDistance > 10 || refreshing ? 1 : 0,
          pointerEvents: 'none'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            background: justCompleted ? '#D4F7E6' : isReady ? '#FEF08A' : '#FFFFFF',
            border: '2px solid #1A1D1E',
            borderRadius: '20px',
            boxShadow: '2px 2px 0px #1A1D1E',
            transform: `scale(${Math.min(0.7 + (pullDistance / THRESHOLD) * 0.3, 1)})`,
            transition: isPulling ? 'none' : 'all 0.2s ease'
          }}
        >
          {justCompleted ? (
            <>
              <Check size={16} color="#1A1D1E" />
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#1A1D1E' }}>Tersinkronisasi!</span>
            </>
          ) : refreshing ? (
            <>
              <RefreshCw size={16} className="animate-spin" color="#1A1D1E" />
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#1A1D1E' }}>Memperbarui...</span>
            </>
          ) : (
            <>
              <RefreshCw
                size={16}
                color="#1A1D1E"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isPulling ? 'none' : 'transform 0.2s'
                }}
              />
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#1A1D1E' }}>
                {isReady ? 'Lepaskan untuk refresh' : 'Tarik ke bawah'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Page Children */}
      {children}
    </div>
  );
}
