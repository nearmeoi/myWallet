/**
 * Disable pinch-to-zoom and accidental double-tap zoom on iOS Safari & mobile devices
 */
export function setupPreventZoom() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // 1. Prevent Safari gesturestart/gesturechange/gestureend (WebKit pinch-to-zoom engine)
  const preventGesture = (e) => {
    e.preventDefault();
  };

  document.addEventListener('gesturestart', preventGesture, { passive: false });
  document.addEventListener('gesturechange', preventGesture, { passive: false });
  document.addEventListener('gestureend', preventGesture, { passive: false });

  // 2. Prevent multi-finger pinch gestures
  document.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // 3. Prevent double-tap to zoom
  let lastTouchEnd = 0;
  document.addEventListener(
    'touchend',
    (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        const target = e.target;
        const isInteractive = target && target.closest && target.closest('input, textarea, select, button, a, [role="button"]');
        if (!isInteractive) {
          e.preventDefault();
        }
      }
      lastTouchEnd = now;
    },
    { passive: false }
  );

  // 4. Prevent Ctrl + wheel zoom (pinch on trackpads)
  document.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    },
    { passive: false }
  );
}
