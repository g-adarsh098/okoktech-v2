import React, { useRef, useEffect, useState } from 'react';
import './CircularGallery.css';

const CARD_W = 340;
const GAP    = 28;
const STEP   = CARD_W + GAP;

const CircularGallery = ({
  items = [],
  onItemClick,
  scrollSpeed = 1,
  scrollEase  = 0.08,
  bend        = 0.35,
}) => {
  const rootRef   = useRef(null);
  const trackRef  = useRef(null);
  const rafRef    = useRef(null);
  const state     = useRef({
    dragging:  false,
    startX:    0,
    startScroll: 0,
    moved:     false,
    targetX:   0,
    currentX:  0,
    velocity:  0,
  });

  const [centerIdx, setCenterIdx] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  /* ── max scroll ──
     With symmetric padding of (0.5*vw - CARD_W/2) on each side,
     the first card starts centred at scrollX=0 and the last card
     is centred when scrollX = (n-1)*STEP.                        */
  const getMax = () => Math.max(0, (items.length - 1) * STEP);

  const clamp = (v) => Math.min(Math.max(v, 0), getMax());

  /* ── RAF animation loop ── */
  useEffect(() => {
    const tick = () => {
      const s = state.current;
      s.currentX += (s.targetX - s.currentX) * scrollEase;

      const track = trackRef.current;
      const root  = rootRef.current;
      if (track && root) {
        track.style.transform = `translateX(${-s.currentX}px)`;

        const wrapW  = root.offsetWidth;
        // The first card's centre is at CARD_W/2 inside the track (after padding).
        // scrollX=0 → card 0 is centred, scrollX=STEP → card 1 is centred, etc.
        const newIdx = Math.round(s.currentX / STEP);
        const mid    = s.currentX + wrapW / 2; // still used for bend dist below
        setCenterIdx(Math.max(0, Math.min(newIdx, items.length - 1)));

        if (bend > 0) {
          const cards = track.querySelectorAll('.cg-card');
          cards.forEach((card, i) => {
            // distance from this card's index to the current scroll position (in card units)
            const dist  = (i - s.currentX / STEP) / (wrapW / STEP / 2);
            const rotY  = dist * 30 * bend;
            const scale = 1 - Math.abs(dist) * 0.13 * bend;
            const tz    = -Math.abs(dist) * 90 * bend;
            card.style.transform = `perspective(1200px) rotateY(${rotY}deg) scale(${scale}) translateZ(${tz}px)`;
            card.style.zIndex    = String(Math.round((1 - Math.min(Math.abs(dist), 1)) * 10));
          });
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [scrollEase, bend, items.length]);

  /* ── Native pointer events via useEffect (avoids React synthetic conflicts) ── */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const onDown = (e) => {
      el.setPointerCapture(e.pointerId);
      const s = state.current;
      s.dragging    = true;
      s.moved       = false;
      s.startX      = e.clientX;
      s.startScroll = s.targetX;
      s.velocity    = 0;
      // Record pressed card NOW — e.target is correct before capture takes over
      const pressedCard = e.target.closest('.cg-card');
      s.pressedIdx = pressedCard ? parseInt(pressedCard.dataset.index, 10) : -1;
      el.style.cursor = 'grabbing';
    };

    const onMove = (e) => {
      const s = state.current;
      if (!s.dragging) return;
      const dx = e.clientX - s.startX;
      if (Math.abs(dx) > 3) s.moved = true;
      const next = clamp(s.startScroll - dx * scrollSpeed);
      s.velocity = next - s.targetX;
      s.targetX  = next;
    };

    const onUp = (e) => {
      const s = state.current;
      if (!s.dragging) return;
      s.dragging      = false;
      el.style.cursor = 'grab';

      // Momentum coast
      const coast = () => {
        s.velocity *= 0.9;
        s.targetX   = clamp(s.targetX + s.velocity);
        if (Math.abs(s.velocity) > 0.4) requestAnimationFrame(coast);
      };
      requestAnimationFrame(coast);

      // Treat as click only if barely moved — use pressedIdx stored at pointerdown
      // because after setPointerCapture, e.target on pointerup is always the root el
      if (!s.moved && s.pressedIdx >= 0 && onItemClick) {
        onItemClick(s.pressedIdx);
      }
      s.pressedIdx = -1;
    };

    const onWheel = (e) => {
      e.preventDefault();
      const s = state.current;
      s.targetX = clamp(s.targetX + e.deltaY * 0.9 * scrollSpeed);
    };

    // Touch
    let touchX = 0;
    let touchScroll = 0;
    const onTouchStart = (e) => {
      touchX      = e.touches[0].clientX;
      touchScroll = state.current.targetX;
    };
    const onTouchMove = (e) => {
      const dx = touchX - e.touches[0].clientX;
      state.current.targetX = clamp(touchScroll + dx * scrollSpeed);
    };

    el.addEventListener('pointerdown',  onDown,      { passive: false });
    el.addEventListener('pointermove',  onMove,      { passive: true });
    el.addEventListener('pointerup',    onUp,        { passive: true });
    el.addEventListener('pointercancel',onUp,        { passive: true });
    el.addEventListener('wheel',        onWheel,     { passive: false });
    el.addEventListener('touchstart',   onTouchStart,{ passive: true });
    el.addEventListener('touchmove',    onTouchMove, { passive: true });

    return () => {
      el.removeEventListener('pointerdown',  onDown);
      el.removeEventListener('pointermove',  onMove);
      el.removeEventListener('pointerup',    onUp);
      el.removeEventListener('pointercancel',onUp);
      el.removeEventListener('wheel',        onWheel);
      el.removeEventListener('touchstart',   onTouchStart);
      el.removeEventListener('touchmove',    onTouchMove);
    };
  }, [scrollSpeed, onItemClick]);

  /* ── Track padding so first card starts centred ── */
  const padX = `calc(50vw - ${CARD_W / 2}px)`;

  return (
    <div className="cg-root" ref={rootRef}>
      <div className="cg-veil cg-veil--left"  />
      <div className="cg-veil cg-veil--right" />

      <div
        className="cg-track"
        ref={trackRef}
        style={{ paddingLeft: padX, paddingRight: padX }}
      >
        {items.map((item, i) => {
          const isCentre  = centerIdx === i;
          const isHovered = hoveredIdx === i;
          return (
            <div
              key={i}
              data-index={i}
              className={[
                'cg-card',
                isCentre  ? 'cg-card--centre'  : '',
                isHovered ? 'cg-card--hovered' : '',
              ].join(' ').trim()}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {isCentre && <div className="cg-glow-ring" />}

              <div className="cg-img-wrap">
                <img
                  src={item.image}
                  alt={item.text}
                  className="cg-img"
                  draggable={false}
                />
                <div className="cg-img-overlay" />
                {isCentre && <div className="cg-centre-badge">Tap to view</div>}
                <span className="cg-num">{String(i + 1).padStart(2, '0')}</span>
              </div>

              <div className="cg-caption">
                <div className="cg-caption-inner">
                  <span className="cg-caption-line" />
                  <h3 className="cg-caption-title">{item.text}</h3>
                  <p className="cg-caption-action">
                    {isCentre ? 'Book Now →' : 'Explore →'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* <div className="cg-hint">
        <span className="cg-hint-icon">⟺</span>
        Drag · Scroll · Tap to book
      </div> */}
    </div>
  );
};

export default CircularGallery;