import { useEffect, useRef, useState } from 'react';
import BeachScene from './BeachScene';
import PhotoDialog from './PhotoDialog';
import { memories } from './data/memories';
import './App.css';
import './beach.css';

const titles = [
  'Before we met', 'One drink before you', 'Oh, me too!', 'Our balcony story',
  'The breakfast crew', 'A perfect day', 'Breakfast detour', 'Our first date',
  'A double date', 'Just us', 'Rings & a missed plan', 'Your first general class',
  'Our little secret', 'Remember our order?', 'One more goodbye', 'A New Year’s wish',
  'All my madness', 'A Burfi selfie', 'Hello, 2026!', 'Late to the movies',
  'A little flight luck', 'Gifts from my pookie', 'Your private fashion show',
  'Birthday flowers', 'Wish you were here', 'Off to Hyderabad', 'A side gig idea',
  'Lolla, day one', 'A day to remember', 'My forever Valentine', 'Our kind of people',
  'Stop photobombing!', 'In the End, with you', 'My cute baby', 'Date night',
  'Pizza by the sea', 'Vibe coding together',
];

function Arrow({ direction }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={direction === 'previous' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} /></svg>;
}

function MemoryPhoto({ memory, title, priority, onOpen }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className="photo-error" role="status">
      <p>This photo couldn’t load.</p>
      <button onClick={() => setFailed(false)}>Try again</button>
    </div>
  ) : (
    <button className="photo-open" onClick={onOpen} aria-label={`Open photo: ${title}`} aria-haspopup="dialog">
      <img src={memory.url} alt={title} onError={() => setFailed(true)} fetchPriority={priority ? 'high' : 'auto'} draggable="false" />
    </button>
  );
}

export default function App() {
  const [{ index, previous }, setSlide] = useState({ index: 0, previous: null });
  const [paused, setPaused] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [timerVersion, setTimerVersion] = useState(0);
  const touchStart = useRef(null);
  const swiped = useRef(false);
  const photoTrigger = useRef(null);
  const count = memories.length;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  // A reduced-motion preference starts the slideshow at rest; Play opts in.
  const [motionOptIn, setMotionOptIn] = useState(false);
  const playing = !photoOpen && !paused && (!reducedMotion || motionOptIn);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setSlide(current => ({ index: (current.index + 1) % count, previous: current.index }));
    }, 10000);
    return () => window.clearInterval(timer);
  }, [count, playing, timerVersion]);

  useEffect(() => {
    const image = new Image();
    image.src = memories[(index + 1) % count].url;
  }, [index, count]);

  function goTo(next) {
    setSlide(current => current.index === (next + count) % count ? current : { index: (next + count) % count, previous: current.index });
    setTimerVersion(version => version + 1);
  }

  function togglePlayback() {
    if (playing) setPaused(true);
    else {
      setPaused(false);
      setMotionOptIn(true);
      setTimerVersion(version => version + 1);
    }
  }

  // Keep the exported dot treatment usable with all 37 memories.
  const dotStart = Math.max(0, Math.min(index - 2, count - 5));
  const compactDotStart = Math.max(0, Math.min(index - 1, count - 3));
  const visibleDots = Array.from({ length: Math.min(5, count) }, (_, offset) => dotStart + offset);
  const memory = memories[index];
  const title = titles[index] || `Memory ${index + 1}`;

  return (
    <div className={`beach-page${playing ? '' : ' is-paused'}`}>
      <a className="skip-link" href="#memory">Skip to memory</a>
      <BeachScene />
      <header className="book-header">
        <div className="book-title">Our Journey so far...</div>
        <div className="memory-counter" aria-label={`Memory ${index + 1} of ${count}`}>{String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}</div>
      </header>

      <main id="memory" className="memory-layout" tabIndex="-1" aria-label="Our memories" aria-roledescription="carousel"
        onKeyDown={event => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            goTo(index + (event.key === 'ArrowLeft' ? -1 : 1));
          }
        }}>
        <div className="memory-photo" onTouchStart={event => { swiped.current = false; touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
          onTouchEnd={event => {
            if (!touchStart.current) return;
            const dx = event.changedTouches[0].clientX - touchStart.current.x;
            const dy = event.changedTouches[0].clientY - touchStart.current.y;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
              swiped.current = true;
              goTo(index + (dx < 0 ? 1 : -1));
            }
            touchStart.current = null;
          }} onTouchCancel={() => { touchStart.current = null; }}>
          {previous !== null && <div className="photo-previous" aria-hidden="true"><img src={memories[previous].url} alt="" draggable="false" /></div>}
          <div className="photo-slide" key={index}>
            <MemoryPhoto memory={memory} title={title} priority={index === 0} onOpen={event => {
              if (swiped.current) { swiped.current = false; return; }
              photoTrigger.current = event.currentTarget;
              setPhotoOpen(true);
            }} />
          </div>
        </div>

        <div className="story-column">
          <article key={index} className="memory-story" aria-live={playing ? 'off' : 'polite'} aria-atomic="true">
            <div className="memory-meta">Our journey · Memory {String(index + 1).padStart(2, '0')}</div>
            <h1>{title}</h1>
            <svg className="story-wave" width="52" height="12" viewBox="0 0 52 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M2 6 q6.5 -8 13 0 t13 0 t13 0 t9 0" /></svg>
            <p tabIndex="0" role="region" aria-label="Memory caption">{memory.caption}</p>
          </article>

          <nav className="carousel-controls" aria-label="Memory navigation">
            <button className="control previous" onClick={() => goTo(index - 1)} aria-label="Previous memory"><Arrow direction="previous" /></button>
            <button className="control next" onClick={() => goTo(index + 1)} aria-label="Next memory"><Arrow direction="next" /></button>
            <button className="control playback" onClick={togglePlayback} aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{playing ? <><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></> : <path d="M8 5l11 7-11 7z" />}</svg>
            </button>
            <div className="memory-dots" aria-label="Nearby memories">
              {visibleDots.map(k => <button key={k} data-edge={k < compactDotStart || k >= compactDotStart + 3 ? 'true' : 'false'} className={`memory-dot${k === index ? ' is-active' : ''}`} onClick={() => goTo(k)} aria-label={`Show memory ${k + 1}`} aria-current={k === index ? 'true' : undefined}><span /></button>)}
            </div>
          </nav>
        </div>
      </main>
      {photoOpen && <PhotoDialog memory={memory} title={title} sourceRef={photoTrigger} onClose={() => {
        setPhotoOpen(false);
        setPaused(false);
        setMotionOptIn(true);
        setTimerVersion(version => version + 1);
        requestAnimationFrame(() => photoTrigger.current?.focus());
      }} />}
    </div>
  );
}
