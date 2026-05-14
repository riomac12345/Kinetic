'use client';

export default function GridBackground() {
  const g = 'rgba(20, 16, 50, 0.68)';
  const gridBg = `linear-gradient(${g} 1px, transparent 1px), linear-gradient(90deg, ${g} 1px, transparent 1px)`;
  const gridSize = '50px 50px';

  const panel = (extra: React.CSSProperties): React.CSSProperties => ({
    position: 'absolute',
    backgroundImage: gridBg,
    backgroundSize: gridSize,
    ...extra,
  });

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>

      {/* Floor */}
      <div style={panel({
        bottom: 0, left: '-250%', right: '-250%', height: '95vh',
        transform: 'perspective(320px) rotateX(75deg)',
        transformOrigin: 'bottom center',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 6%, rgba(0,0,0,0.85) 25%, black 50%)',
        maskImage:        'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 6%, rgba(0,0,0,0.85) 25%, black 50%)',
      })} />

      {/* Ceiling */}
      <div style={panel({
        top: 0, left: '-250%', right: '-250%', height: '78vh',
        transform: 'perspective(320px) rotateX(-75deg)',
        transformOrigin: 'top center',
        opacity: 0.75,
        WebkitMaskImage: 'linear-gradient(to top, transparent 0%, rgba(0,0,0,0.3) 6%, rgba(0,0,0,0.85) 25%, black 50%)',
        maskImage:        'linear-gradient(to top, transparent 0%, rgba(0,0,0,0.3) 6%, rgba(0,0,0,0.85) 25%, black 50%)',
      })} />

      {/* Left wall */}
      <div style={panel({
        left: 0, top: '-200%', bottom: '-200%', width: '85vw',
        transform: 'perspective(320px) rotateY(79deg)',
        transformOrigin: 'left center',
        opacity: 0.85,
        WebkitMaskImage: 'linear-gradient(to left, transparent 0%, rgba(0,0,0,0.3) 8%, rgba(0,0,0,0.8) 35%, black 65%)',
        maskImage:        'linear-gradient(to left, transparent 0%, rgba(0,0,0,0.3) 8%, rgba(0,0,0,0.8) 35%, black 65%)',
      })} />

      {/* Right wall */}
      <div style={panel({
        right: 0, top: '-200%', bottom: '-200%', width: '85vw',
        transform: 'perspective(320px) rotateY(-79deg)',
        transformOrigin: 'right center',
        opacity: 0.85,
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 8%, rgba(0,0,0,0.8) 35%, black 65%)',
        maskImage:        'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 8%, rgba(0,0,0,0.8) 35%, black 65%)',
      })} />

    </div>
  );
}
