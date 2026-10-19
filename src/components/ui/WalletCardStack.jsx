import React, { useState, useRef, useMemo } from 'react';
import { 
  ArrowDownLeft, ArrowUpRight, ArrowLeftRight, 
  PieChart, AlertCircle, ChevronLeft, ChevronRight, 
  Banknote, CreditCard, Smartphone, Edit3, Plus
} from 'lucide-react';
import { formatRupiah } from '../../lib/utils';

// Premium cubic-bezier easing curves for butter-smooth transitions with ease-in and ease-out
const EASE_IN_OUT = 'cubic-bezier(0.4, 0.0, 0.2, 1)';
const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0.0, 1, 1)';
const EASE_SNAP_BACK = 'cubic-bezier(0.175, 0.885, 0.32, 1.15)';

export default function WalletCardStack({
  balance = 0,
  wallets = [],
  totalOwed = 0,
  onOpenModal,
  onOpenSummary
}) {
  // Build cards list:
  // Card 0 is always Total Saldo (preserving existing look & mechanism).
  // Then one card for each wallet in wallets array.
  // If no wallets yet, show placeholder to guide user.
  const cards = useMemo(() => {
    const list = [
      {
        id: 'total',
        type: 'total',
        title: 'Total Saldo.',
        balance: balance,
        bg: '#BBEFFA',
        ornamentBg: '#FEF08A'
      }
    ];

    if (wallets && wallets.length > 0) {
      const PALETTES = [
        { bg: '#FEF08A', ornament: '#FEF9C3' }, // Soft Yellow
        { bg: '#D4F7E6', ornament: '#BBF7D0' }, // Fresh Mint
        { bg: '#E0CCF8', ornament: '#DDD6FE' }, // Lavender
        { bg: '#FED7AA', ornament: '#FFEDD5' }, // Peach
        { bg: '#FBCFE8', ornament: '#FCE7F3' }, // Pink
        { bg: '#BAE6FD', ornament: '#E0F2FE' }, // Sky
      ];

      wallets.forEach((w, idx) => {
        let palette = PALETTES[idx % PALETTES.length];
        if (w.type === 'cash') palette = { bg: '#D4F7E6', ornament: '#BBF7D0' };
        else if (w.type === 'bank') palette = { bg: '#FEF08A', ornament: '#FEF9C3' };
        else if (w.type === 'ewallet') palette = { bg: '#E0CCF8', ornament: '#DDD6FE' };

        list.push({
          id: `wallet-${w.id}`,
          type: 'wallet',
          wallet: w,
          title: w.name,
          balance: parseFloat(w.balance || 0),
          bg: palette.bg,
          ornamentBg: palette.ornament
        });
      });
    } else {
      list.push({
        id: 'add-wallet-placeholder',
        type: 'placeholder',
        title: 'Tambah Dompet',
        bg: '#FEF9C3',
        ornamentBg: '#FEF08A'
      });
    }

    return list;
  }, [balance, wallets]);

  const [rawActiveIndex, setRawActiveIndex] = useState(0);
  const activeIndex = rawActiveIndex >= cards.length ? 0 : rawActiveIndex;
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [animatingState, setAnimatingState] = useState(null); // { type: 'next' | 'prev', direction: 'left' | 'right', phase: 'out' | 'in' }

  // Handle loop forward (next card, current slides out and goes to back)
  const triggerNext = (direction = 'left') => {
    if (animatingState || cards.length <= 1) return;
    setAnimatingState({ type: 'next', direction, phase: 'out' });

    setTimeout(() => {
      setRawActiveIndex(prev => (prev + 1) % cards.length);
      setAnimatingState({ type: 'next', direction, phase: 'in' });

      setTimeout(() => {
        setAnimatingState(null);
        setDragOffset(0);
      }, 300);
    }, 320);
  };

  const goToIndex = (targetIdx) => {
    if (animatingState || targetIdx === activeIndex || targetIdx >= cards.length) return;
    const direction = targetIdx > activeIndex ? 'left' : 'right';
    setAnimatingState({ type: 'next', direction, phase: 'out' });

    setTimeout(() => {
      setRawActiveIndex(targetIdx);
      setAnimatingState({ type: 'next', direction, phase: 'in' });

      setTimeout(() => {
        setAnimatingState(null);
        setDragOffset(0);
      }, 300);
    }, 320);
  };

  // Touch & Pointer Gesture Handling
  const dragStartRef = useRef({ x: 0, y: 0 });
  const isHorizontalDrag = useRef(null);
  const isMouseDownRef = useRef(false);

  const handleTouchStart = (e) => {
    e.stopPropagation();
    if (animatingState || cards.length <= 1) return;
    if (e.target.closest('button')) return;
    const touch = e.touches[0];
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
    isHorizontalDrag.current = null;
    setIsDragging(false);
  };

  const handleTouchMove = (e) => {
    e.stopPropagation();
    if (animatingState || cards.length <= 1) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartRef.current.x;
    const deltaY = touch.clientY - dragStartRef.current.y;

    if (isHorizontalDrag.current === null) {
      if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
        isHorizontalDrag.current = Math.abs(deltaX) >= Math.abs(deltaY);
      }
    }

    if (isHorizontalDrag.current) {
      if (e.cancelable) e.preventDefault();
      setIsDragging(true);
      setDragOffset(deltaX);
    }
  };

  const handleTouchEnd = (e) => {
    e.stopPropagation();
    if (animatingState || cards.length <= 1) return;
    if (!isDragging) {
      setDragOffset(0);
      return;
    }

    setIsDragging(false);
    const threshold = 55;
    if (dragOffset < -threshold) {
      triggerNext('left');
    } else if (dragOffset > threshold) {
      triggerNext('right');
    } else {
      setDragOffset(0);
    }
  };

  const handleMouseDown = (e) => {
    if (animatingState || cards.length <= 1) return;
    if (e.target.closest('button')) return;
    isMouseDownRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isMouseDownRef.current || animatingState || cards.length <= 1) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    if (Math.abs(deltaX) > 5) {
      setIsDragging(true);
      setDragOffset(deltaX);
    }
  };

  const handleMouseUp = () => {
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;
    if (!isDragging) {
      setDragOffset(0);
      return;
    }
    setIsDragging(false);
    const threshold = 55;
    if (dragOffset < -threshold) {
      triggerNext('left');
    } else if (dragOffset > threshold) {
      triggerNext('right');
    } else {
      setDragOffset(0);
    }
  };

  const activeCard = cards[activeIndex] || cards[0];

  // Calculate dynamic transformation for each card in the deck
  const getCardStyle = (relativePos) => {
    const isFront = relativePos === 0;
    const isSecond = relativePos === 1;
    const isThird = relativePos === 2;
    const isLast = relativePos === cards.length - 1;

    // 1. IDLE STATE
    if (!animatingState) {
      if (isFront) {
        return {
          transform: `translate3d(${dragOffset}px, 0, 0) rotate(${dragOffset * 0.045}deg) scale(1)`,
          zIndex: 10,
          opacity: 1,
          transition: isDragging 
            ? 'none' 
            : `transform 0.35s ${EASE_SNAP_BACK}, opacity 0.35s ${EASE_IN_OUT}`,
          cursor: cards.length > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          transformOrigin: 'top center',
          willChange: 'transform, opacity',
          pointerEvents: 'auto'
        };
      }
      if (isSecond) {
        const dragFactor = Math.min(Math.abs(dragOffset) / 200, 1);
        const translateY = -14 + dragFactor * 14;
        const scale = 0.96 + dragFactor * 0.04;
        return {
          transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
          zIndex: 9,
          opacity: 1,
          transition: isDragging ? 'none' : `transform 0.35s ${EASE_OUT}`,
          transformOrigin: 'top center',
          willChange: 'transform, opacity',
          cursor: 'pointer',
          pointerEvents: 'auto'
        };
      }
      if (isThird) {
        const dragFactor = Math.min(Math.abs(dragOffset) / 200, 1);
        const translateY = -28 + dragFactor * 14;
        const scale = 0.92 + dragFactor * 0.04;
        return {
          transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
          zIndex: 8,
          opacity: 1,
          transition: isDragging ? 'none' : `transform 0.35s ${EASE_OUT}`,
          transformOrigin: 'top center',
          willChange: 'transform, opacity',
          cursor: 'pointer',
          pointerEvents: 'auto'
        };
      }
      return {
        transform: 'translate3d(0, -28px, 0) scale(0.88)',
        zIndex: 5,
        opacity: 0,
        transition: `transform 0.35s ${EASE_OUT}, opacity 0.35s ${EASE_IN_OUT}`,
        pointerEvents: 'none',
        transformOrigin: 'top center'
      };
    }

    // 2. PHASE 1: FLYING OUT (Ease In to depart smoothly)
    if (animatingState.phase === 'out') {
      const dir = animatingState.direction === 'left' ? -1 : 1;
      if (isFront) {
        return {
          transform: `translate3d(${dir * 115}%, 0, 0) rotate(${dir * 14}deg)`,
          zIndex: 10,
          opacity: 0.7,
          transition: `transform 0.32s ${EASE_IN_OUT}, opacity 0.32s ${EASE_IN}`,
          transformOrigin: 'top center',
          willChange: 'transform, opacity',
          pointerEvents: 'none'
        };
      }
      if (isSecond) {
        return {
          transform: 'translate3d(0, 0, 0) scale(1)',
          zIndex: 9,
          opacity: 1,
          transition: `transform 0.32s ${EASE_IN_OUT}`,
          transformOrigin: 'top center',
          willChange: 'transform, opacity',
          pointerEvents: 'none'
        };
      }
      if (isThird) {
        return {
          transform: 'translate3d(0, -14px, 0) scale(0.96)',
          zIndex: 8,
          opacity: 1,
          transition: `transform 0.32s ${EASE_IN_OUT}`,
          transformOrigin: 'top center',
          willChange: 'transform, opacity',
          pointerEvents: 'none'
        };
      }
      if (relativePos === 3) {
        return {
          transform: 'translate3d(0, -28px, 0) scale(0.92)',
          zIndex: 7,
          opacity: 1,
          transition: `transform 0.32s ${EASE_IN_OUT}, opacity 0.32s ${EASE_IN_OUT}`,
          transformOrigin: 'top center',
          pointerEvents: 'none'
        };
      }
      return {
        transform: 'translate3d(0, -28px, 0) scale(0.88)',
        zIndex: 4,
        opacity: 0,
        pointerEvents: 'none'
      };
    }

    // 3. PHASE 2: SLIDING IN / SETTLING (Ease Out to land smoothly)
    if (animatingState.phase === 'in') {
      if (isFront) {
        return {
          transform: 'translate3d(0, 0, 0) scale(1)',
          zIndex: 10,
          opacity: 1,
          transition: `transform 0.3s ${EASE_OUT}`,
          transformOrigin: 'top center',
          willChange: 'transform, opacity',
          pointerEvents: 'auto'
        };
      }
      if (isSecond) {
        return {
          transform: 'translate3d(0, -14px, 0) scale(0.96)',
          zIndex: 9,
          opacity: 1,
          transition: `transform 0.3s ${EASE_OUT}`,
          transformOrigin: 'top center',
          willChange: 'transform, opacity',
          pointerEvents: 'auto'
        };
      }
      if (isThird) {
        return {
          transform: 'translate3d(0, -28px, 0) scale(0.92)',
          zIndex: 8,
          opacity: 1,
          transition: `transform 0.3s ${EASE_OUT}`,
          transformOrigin: 'top center',
          willChange: 'transform, opacity',
          pointerEvents: 'auto'
        };
      }
      if (isLast) {
        return {
          transform: cards.length >= 3 ? 'translate3d(0, -28px, 0) scale(0.92)' : 'translate3d(0, -14px, 0) scale(0.96)',
          zIndex: 4,
          opacity: 1,
          transition: `transform 0.32s ${EASE_OUT}, opacity 0.32s ${EASE_IN_OUT}`,
          transformOrigin: 'top center',
          willChange: 'transform, opacity',
          pointerEvents: 'none'
        };
      }
      return {
        transform: 'translate3d(0, -28px, 0) scale(0.88)',
        zIndex: 4,
        opacity: 0,
        pointerEvents: 'none'
      };
    }
  };

  const handleCardClick = (relativePos) => {
    if (isDragging || animatingState) return;
    if (relativePos === 1) {
      triggerNext('left');
    } else if (relativePos === 2) {
      goToIndex((activeIndex + 2) % cards.length);
    }
  };

  return (
    <div 
      data-card-stack="true"
      data-no-ptr="true"
      style={{ marginTop: '4px', marginBottom: '16px' }}
    >
      {/* Top Deck Status & Navigation Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
        padding: '0 2px'
      }}>
        {/* Active Card Pill Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: '#FFFFFF',
            border: '2px solid #1A1D1E',
            borderRadius: '20px',
            boxShadow: '1.5px 1.5px 0px #1A1D1E',
            fontSize: '11px',
            fontWeight: '800'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: activeCard.type === 'total' ? '#38BDF8' : activeCard.type === 'wallet' ? '#10B981' : '#F59E0B',
              border: '1px solid #1A1D1E',
              display: 'inline-block'
            }} />
            <span>{activeCard.type === 'total' ? 'Semua Dompet' : activeCard.title}</span>
          </div>

          {cards.length > 1 && (
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#666' }}>
              {activeIndex + 1} / {cards.length}
            </span>
          )}
        </div>

        {/* Navigation Arrows & Mini Dots */}
        {cards.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '4px', marginRight: '4px' }}>
              {cards.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToIndex(i)}
                  style={{
                    width: i === activeIndex ? '16px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
                    background: i === activeIndex ? '#1A1D1E' : '#D1D5DB',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  title={c.title}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => triggerNext('right')}
              className="btn-pressed-blue"
              title="Geser ke Kanan"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                border: '1.5px solid #1A1D1E',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '1.5px 1.5px 0px #1A1D1E',
                padding: 0,
                color: '#1A1D1E'
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => triggerNext('left')}
              className="btn-pressed-blue"
              title="Dompet Berikutnya"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                border: '1.5px solid #1A1D1E',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '1.5px 1.5px 0px #1A1D1E',
                padding: 0,
                color: '#1A1D1E'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Stacked Cards Area */}
      <div 
        data-card-stack="true"
        data-no-ptr="true"
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: cards.length > 1 ? '24px' : '0px',
          userSelect: 'none',
          touchAction: 'pan-y',
          overscrollBehavior: 'contain',
          perspective: '1000px'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Invisible Spacer Card: automatically defines 100% responsive height for container */}
        <div 
          className="card" 
          aria-hidden="true"
          style={{ 
            visibility: 'hidden', 
            pointerEvents: 'none', 
            margin: 0, 
            opacity: 0,
            padding: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <p style={{ fontSize: '14px', fontWeight: '600' }}>Spacer</p>
          </div>
          <h2 style={{ fontSize: '38px', fontWeight: '900', marginBottom: totalOwed > 0 ? '8px' : '24px', lineHeight: '1' }}>
            Rp 00.000.000
          </h2>
          {totalOwed > 0 && (
            <div style={{ marginBottom: '16px', padding: '6px 10px', height: '32px' }} />
          )}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '100px', height: '44px' }} />
            <div style={{ flex: 1, minWidth: '100px', height: '44px' }} />
            <div style={{ flex: '1 1 100%', height: '44px', marginTop: '4px' }} />
          </div>
        </div>

        {/* Stacked Cards Deck */}
        {cards.map((card, index) => {
          const relativePos = (index - activeIndex + cards.length) % cards.length;
          const cardStyle = getCardStyle(relativePos);

          return (
            <section
              key={card.id}
              onClick={() => handleCardClick(relativePos)}
              className="card"
              style={{
                position: 'absolute',
                top: cards.length > 1 ? '24px' : 0,
                left: 0,
                right: 0,
                bottom: 0,
                margin: 0,
                background: card.bg,
                overflow: 'hidden',
                ...cardStyle
              }}
            >
              {/* TOTAL SALDO CARD */}
              {card.type === 'total' && (
                <>
                  {/* Yellow circle ornament (preserved) */}
                  <div style={{ 
                    position: 'absolute', top: '-20px', right: '-20px', 
                    width: '100px', height: '100px', background: card.ornamentBg, 
                    borderRadius: '50%', border: '2px solid #1A1D1E', zIndex: 0 
                  }} />

                  {/* PieChart Icon Button in Top Right of Card */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenSummary) onOpenSummary();
                    }}
                    title="Lihat Ringkasan & Grafik"
                    className="btn-pressed-blue"
                    style={{
                      position: 'absolute',
                      top: '14px',
                      right: '14px',
                      zIndex: 2,
                      width: '40px',
                      height: '40px',
                      background: '#FFFFFF',
                      border: '2px solid #1A1D1E',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '2px 2px 0px #1A1D1E',
                      cursor: 'pointer',
                      color: '#1A1D1E'
                    }}
                  >
                    <PieChart size={20} />
                  </button>

                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <p style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>Total Saldo.</p>
                        <span style={{ 
                          fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', 
                          padding: '2px 6px', background: '#FFFFFF', border: '1.5px solid #1A1D1E', 
                          borderRadius: '6px' 
                        }}>
                          Semua Dompet
                        </span>
                      </div>

                      <h2 style={{ fontSize: '38px', fontWeight: '900', marginBottom: totalOwed > 0 ? '8px' : '24px', lineHeight: '1', letterSpacing: '-0.02em' }}>
                        {formatRupiah(card.balance)}
                      </h2>

                      {/* Debt Indicator */}
                      {totalOwed > 0 && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          marginBottom: '16px', padding: '6px 10px',
                          background: '#FFC0C0', border: '2px solid #1A1D1E', borderRadius: '8px',
                          width: 'fit-content'
                        }}>
                          <AlertCircle size={14} color="#EF4444" />
                          <span style={{ fontSize: '13px', fontWeight: '800', color: '#EF4444' }}>
                            Hutang: -{formatRupiah(totalOwed)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenModal('transaction', 'income');
                        }} 
                        className="btn-pressed-blue" 
                        style={{
                          flex: 1, minWidth: '100px', padding: '12px 10px', background: '#1A1D1E', color: '#fff',
                          border: '2px solid #1A1D1E', borderRadius: '8px', fontWeight: '700', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px',
                          boxShadow: '3px 3px 0px rgba(0,0,0,0.2)', cursor: 'pointer'
                        }}
                      >
                        <ArrowDownLeft size={16} /> Masuk
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenModal('transaction', 'expense');
                        }} 
                        className="btn-pressed-blue" 
                        style={{
                          flex: 1, minWidth: '100px', padding: '12px 10px', background: '#FFFFFF', color: '#1A1D1E',
                          border: '2px solid #1A1D1E', borderRadius: '8px', fontWeight: '700', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px',
                          boxShadow: '3px 3px 0px #1A1D1E', cursor: 'pointer'
                        }}
                      >
                        <ArrowUpRight size={16} /> Keluar
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenModal('transfer');
                        }} 
                        className="btn-pressed-blue" 
                        style={{
                          flex: '1 1 100%', padding: '12px 10px', background: '#E0CCF8', color: '#1A1D1E',
                          border: '2px solid #1A1D1E', borderRadius: '8px', fontWeight: '700', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px',
                          boxShadow: '3px 3px 0px #1A1D1E', marginTop: '4px', cursor: 'pointer'
                        }}
                      >
                        <ArrowLeftRight size={16} /> Transfer Antar Dompet
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* WALLET INDIVIDUAL CARD */}
              {card.type === 'wallet' && (
                <>
                  {/* Decorative circle ornament */}
                  <div style={{ 
                    position: 'absolute', top: '-20px', right: '-20px', 
                    width: '100px', height: '100px', background: card.ornamentBg, 
                    borderRadius: '50%', border: '2px solid #1A1D1E', zIndex: 0 
                  }} />

                  {/* Top Right Action: Edit Wallet Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenModal('wallet', '', card.wallet);
                    }}
                    title={`Edit ${card.wallet.name}`}
                    className="btn-pressed-blue"
                    style={{
                      position: 'absolute',
                      top: '14px',
                      right: '14px',
                      zIndex: 2,
                      width: '40px',
                      height: '40px',
                      background: '#FFFFFF',
                      border: '2px solid #1A1D1E',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '2px 2px 0px #1A1D1E',
                      cursor: 'pointer',
                      color: '#1A1D1E'
                    }}
                  >
                    <Edit3 size={18} />
                  </button>

                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                    <div>
                      {/* Wallet Type & Name Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <span style={{ 
                          fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', 
                          padding: '2px 8px', background: '#FFFFFF', border: '1.5px solid #1A1D1E', 
                          borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' 
                        }}>
                          {card.wallet.type === 'cash' ? <Banknote size={13} /> : card.wallet.type === 'bank' ? <CreditCard size={13} /> : <Smartphone size={13} />}
                          {card.wallet.type === 'cash' ? 'Tunai' : card.wallet.type === 'bank' ? 'Bank' : 'E-Wallet'}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#1A1D1E' }}>
                          {card.wallet.name}
                        </span>
                      </div>

                      {/* Individual Wallet Balance */}
                      <h2 style={{ fontSize: '38px', fontWeight: '900', marginBottom: totalOwed > 0 ? '8px' : '24px', lineHeight: '1', letterSpacing: '-0.02em' }}>
                        {formatRupiah(card.balance)}
                      </h2>

                      {/* Status indicator (balanced height with debt indicator) */}
                      {totalOwed > 0 && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          marginBottom: '16px', padding: '6px 10px',
                          background: '#FFFFFF', border: '2px solid #1A1D1E', borderRadius: '8px',
                          width: 'fit-content'
                        }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', border: '1px solid #1A1D1E' }} />
                          <span style={{ fontSize: '13px', fontWeight: '800', color: '#1A1D1E' }}>
                            Saldo Dompet
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons: prefilled with this specific wallet! */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenModal('transaction', 'income', { walletId: card.wallet.id });
                        }} 
                        className="btn-pressed-blue" 
                        style={{
                          flex: 1, minWidth: '100px', padding: '12px 10px', background: '#1A1D1E', color: '#fff',
                          border: '2px solid #1A1D1E', borderRadius: '8px', fontWeight: '700', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px',
                          boxShadow: '3px 3px 0px rgba(0,0,0,0.2)', cursor: 'pointer'
                        }}
                      >
                        <ArrowDownLeft size={16} /> Masuk
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenModal('transaction', 'expense', { walletId: card.wallet.id });
                        }} 
                        className="btn-pressed-blue" 
                        style={{
                          flex: 1, minWidth: '100px', padding: '12px 10px', background: '#FFFFFF', color: '#1A1D1E',
                          border: '2px solid #1A1D1E', borderRadius: '8px', fontWeight: '700', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px',
                          boxShadow: '3px 3px 0px #1A1D1E', cursor: 'pointer'
                        }}
                      >
                        <ArrowUpRight size={16} /> Keluar
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenModal('transfer', 'expense', { walletId: card.wallet.id, type: 'expense' });
                        }} 
                        className="btn-pressed-blue" 
                        style={{
                          flex: '1 1 100%', padding: '12px 10px', background: '#E0CCF8', color: '#1A1D1E',
                          border: '2px solid #1A1D1E', borderRadius: '8px', fontWeight: '700', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px',
                          boxShadow: '3px 3px 0px #1A1D1E', marginTop: '4px', cursor: 'pointer'
                        }}
                      >
                        <ArrowLeftRight size={16} /> Transfer Antar Dompet
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* PLACEHOLDER CARD: Shown when 0 wallets exist */}
              {card.type === 'placeholder' && (
                <>
                  <div style={{ 
                    position: 'absolute', top: '-20px', right: '-20px', 
                    width: '100px', height: '100px', background: card.ornamentBg, 
                    borderRadius: '50%', border: '2px solid #1A1D1E', zIndex: 0 
                  }} />

                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <span style={{ 
                          fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', 
                          padding: '2px 8px', background: '#FFFFFF', border: '1.5px solid #1A1D1E', 
                          borderRadius: '6px' 
                        }}>
                          + Dompet Baru
                        </span>
                      </div>
                      <h3 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '8px', color: '#1A1D1E' }}>
                        Pisahkan Saldo Anda
                      </h3>
                      <p style={{ fontSize: '13px', color: '#444', fontWeight: '600', lineHeight: '1.4' }}>
                        Kelola uang tunai, rekening bank, dan dompet digital dalam wadah terpisah agar keuangan lebih rapi.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenModal('wallet');
                      }}
                      className="btn-pressed-blue"
                      style={{
                        width: '100%', padding: '14px', background: '#1A1D1E', color: '#FFFFFF',
                        border: '2px solid #1A1D1E', borderRadius: '10px', fontWeight: '800',
                        fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        boxShadow: '3px 3px 0px rgba(0,0,0,0.2)', cursor: 'pointer', marginTop: '16px'
                      }}
                    >
                      <Plus size={18} /> Buat Dompet Pertama
                    </button>
                  </div>
                </>
              )}
            </section>
          );
        })}
      </div>

      {/* Swipe helper text when multiple cards exist */}
      {cards.length > 1 && (
        <p style={{ 
          fontSize: '11px', color: '#888', fontWeight: '700', textAlign: 'center', 
          marginTop: '8px', marginBottom: '4px' 
        }}>
          Geser kartu ke samping untuk melihat saldo dompet lainnya
        </p>
      )}
    </div>
  );
}
