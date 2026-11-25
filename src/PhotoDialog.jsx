import { useLayoutEffect, useRef, useState } from 'react';

export default function PhotoDialog({ memory, title, sourceRef, onClose }) {
  const dialogRef = useRef(null);
  const panelRef = useRef(null);
  const animationRef = useRef(null);
  const closingRef = useRef(false);
  const [closing, setClosing] = useState(false);
  const pointerStartedOutside = useRef(false);

  function thumbnailTransform() {
    const source = sourceRef.current?.querySelector('img');
    const panel = panelRef.current;
    if (!source || !panel) return 'scale(.92)';
    const from = source.getBoundingClientRect();
    // offset dimensions are unaffected by an in-flight opening animation.
    const to = { left: panel.offsetLeft, top: panel.offsetTop, width: panel.offsetWidth, height: panel.offsetHeight };
    return `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`;
  }

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    const source = sourceRef.current?.querySelector('img');
    const sourceVisibility = source?.style.visibility;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    const from = source?.getBoundingClientRect();
    const origin = from ? `translate(${from.left - panel.offsetLeft}px, ${from.top - panel.offsetTop}px) scale(${from.width / panel.offsetWidth}, ${from.height / panel.offsetHeight})` : 'scale(.92)';
    if (source) source.style.visibility = 'hidden';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    animationRef.current = panel.animate([
      { transform: origin, opacity: .5, borderRadius: '8px' },
      { transform: 'translate(0, 0) scale(1, 1)', opacity: 1, borderRadius: getComputedStyle(panel).borderRadius },
    ], { duration: reduced ? 0 : 560, easing: 'cubic-bezier(.16, .85, .2, 1)', fill: 'both' });
    return () => {
      animationRef.current?.cancel();
      if (source) source.style.visibility = sourceVisibility;
      dialog.close();
      document.body.style.overflow = overflow;
    };
  }, [sourceRef]);

  function requestClose() {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    const panel = panelRef.current;
    const current = getComputedStyle(panel);
    const start = { transform: current.transform, opacity: current.opacity, borderRadius: current.borderRadius };
    const destination = thumbnailTransform();
    animationRef.current?.cancel();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animation = panel.animate([start, { transform: destination, opacity: .15, borderRadius: '8px' }], {
      duration: reduced ? 0 : 420, easing: 'cubic-bezier(.4, 0, .25, 1)', fill: 'both',
    });
    animationRef.current = animation;
    animation.finished.then(onClose).catch(() => {});
  }

  return (
    <dialog ref={dialogRef} className="photo-dialog" data-closing={closing} aria-labelledby="photo-dialog-title" aria-busy={closing}
      onKeyDown={event => {
        if (event.key === 'Tab') {
          event.preventDefault();
          dialogRef.current.querySelector('.glass-close').focus();
        }
      }}
      onCancel={event => { event.preventDefault(); requestClose(); }}
      onPointerDown={event => { pointerStartedOutside.current = event.target === event.currentTarget; }}
      onClick={event => { if (pointerStartedOutside.current && event.target === event.currentTarget) requestClose(); }}>
      <div ref={panelRef} className="photo-glass-panel">
        <header className="photo-dialog-header">
          <h2 id="photo-dialog-title">{title}</h2>
          <button className="glass-close" onClick={requestClose} aria-label="Close photo" autoFocus>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </header>
        <div className="photo-dialog-image"><img src={memory.url} alt={title} /></div>
      </div>
    </dialog>
  );
}
