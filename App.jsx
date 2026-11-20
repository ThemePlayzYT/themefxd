import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ANIMATIONS, COLLECTIONS, getAnimation, getCollection, getCollectionItems } from './data.js';

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

const svgProps = {
  width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: false,
};

const Icon = {
  Menu: (p) => <svg {...svgProps} {...p}><path d="M4 7h16M4 12h16M4 17h10" /></svg>,
  Search: (p) => <svg {...svgProps} {...p}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>,
  User: (p) => <svg {...svgProps} {...p}><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20c1.6-3.4 4.2-5 7.5-5s5.9 1.6 7.5 5" /></svg>,
  Grid: (p) => <svg {...svgProps} {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></svg>,
  Download: (p) => <svg {...svgProps} strokeWidth={2} {...p}><path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14" /></svg>,
  Play: (p) => <svg {...svgProps} fill="currentColor" stroke="none" {...p}><path d="M8 5.5v13l10-6.5z" /></svg>,
  Pause: (p) => <svg {...svgProps} fill="currentColor" stroke="none" {...p}><rect x="6.5" y="5.5" width="4" height="13" rx="1" /><rect x="13.5" y="5.5" width="4" height="13" rx="1" /></svg>,
  Volume: (p) => <svg {...svgProps} {...p}><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></svg>,
  Mute: (p) => <svg {...svgProps} {...p}><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" /><path d="M16 9.5l5 5M21 9.5l-5 5" /></svg>,
};

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/* Performance rules:
   - a video's file is requested only when it is near the viewport
   - autoplay videos play only while visible, and pause when they leave the screen
   - at most MAX_ACTIVE videos play at once
   - everything pauses when the tab is hidden
   - progress is written straight to the DOM (no re-render per frame)
   mode 'autoplay': muted, looping, plays while on screen (library cards)
   mode 'hover':    plays only while the pointer is over its card (collection list) */
const MAX_ACTIVE = 4;
const activeVideos = [];

function markActive(video) {
  const i = activeVideos.indexOf(video);
  if (i !== -1) activeVideos.splice(i, 1);
  activeVideos.push(video);
  while (activeVideos.length > MAX_ACTIVE) {
    const oldest = activeVideos.shift();
    if (oldest && oldest !== video) oldest.pause();
  }
}

function releaseActive(video) {
  const i = activeVideos.indexOf(video);
  if (i !== -1) activeVideos.splice(i, 1);
  video.pause();
}

function useLazyVideo(videoRef, { src, mode, progressRef }) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return undefined;

    video.muted = true;
    let loaded = false;
    const load = () => {
      if (loaded) return;
      loaded = true;
      video.src = src;
    };

    const loadObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          load();
          loadObserver.disconnect();
        }
      },
      { rootMargin: '300px 0px' }
    );
    loadObserver.observe(video);

    const onTimeUpdate = () => {
      if (progressRef && progressRef.current && video.duration) {
        progressRef.current.style.transform = `scaleX(${video.currentTime / video.duration})`;
      }
    };
    video.addEventListener('timeupdate', onTimeUpdate);

    const onVisibility = () => {
      if (document.hidden) video.pause();
    };
    document.addEventListener('visibilitychange', onVisibility);

    let playObserver = null;
    let card = null;
    const onEnter = () => {
      load();
      markActive(video);
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
    };
    const onLeave = () => releaseActive(video);

    if (mode === 'autoplay') {
      playObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              load();
              markActive(video);
              const p = video.play();
              if (p && p.catch) p.catch(() => {});
            } else {
              releaseActive(video);
            }
          });
        },
        { threshold: 0.35 }
      );
      playObserver.observe(video);
    } else {
      card = video.closest('.card');
      if (card) {
        card.addEventListener('pointerenter', onEnter);
        card.addEventListener('pointerleave', onLeave);
      }
    }

    return () => {
      loadObserver.disconnect();
      if (playObserver) playObserver.disconnect();
      video.removeEventListener('timeupdate', onTimeUpdate);
      document.removeEventListener('visibilitychange', onVisibility);
      if (card) {
        card.removeEventListener('pointerenter', onEnter);
        card.removeEventListener('pointerleave', onLeave);
      }
      releaseActive(video);
    };
  }, [src, mode, videoRef, progressRef]);
}

/* ------------------------------------------------------------------ */
/* Small components                                                    */
/* ------------------------------------------------------------------ */

function LazyVideo({ src, poster, mode = 'autoplay', progressRef, className = '' }) {
  const videoRef = useRef(null);
  useLazyVideo(videoRef, { src, mode, progressRef });
  return (
    <video
      ref={videoRef}
      className={className}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      tabIndex={-1}
      aria-hidden="true"
      disablePictureInPicture
    />
  );
}

function AnimationCard({ to, title, video, poster, mode = 'autoplay', index = 0 }) {
  const progressRef = useRef(null);
  return (
    <Link to={to} className="card" style={{ '--i': index }} aria-label={title}>
      <div className="card-thumb">
        <LazyVideo src={video} poster={poster} mode={mode} progressRef={progressRef} className="card-video" />
      </div>
      <div className="card-progress" aria-hidden="true">
        <span ref={progressRef} className="card-progress-fill" />
      </div>
      <div className="card-meta">
        <h3>{title}</h3>
        <span className="card-cat">ANIMATIONS</span>
      </div>
    </Link>
  );
}

function SearchBar({ value, onChange }) {
  return (
    <label className="search">
      <Icon.Search />
      <input
        id="library-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') onChange(''); }}
        placeholder="Search animations by name"
        aria-label="Search animations by name"
        autoComplete="off"
        spellCheck={false}
      />
    </label>
  );
}

function formatTime(seconds) {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  const cs = Math.floor((safe % 1) * 100);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

const TIMELINE_EVENTS = ['timeupdate', 'loadedmetadata', 'durationchange', 'play', 'pause', 'ended', 'volumechange', 'progress', 'seeked'];

function VideoTimeline({ videoRef }) {
  const trackRef = useRef(null);
  const draggingRef = useRef(false);
  const [state, setState] = useState({ current: 0, duration: 0, playing: false, muted: false, buffered: 0 });
  const [hoverRatio, setHoverRatio] = useState(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    const sync = () => {
      const r = video.buffered;
      const end = r.length ? r.end(r.length - 1) : 0;
      setState({
        current: video.currentTime,
        duration: video.duration || 0,
        playing: !video.paused && !video.ended,
        muted: video.muted,
        buffered: video.duration ? end / video.duration : 0,
      });
    };
    TIMELINE_EVENTS.forEach((n) => video.addEventListener(n, sync));
    sync();
    return () => TIMELINE_EVENTS.forEach((n) => video.removeEventListener(n, sync));
  }, [videoRef]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) video.muted = !video.muted;
  };

  const ratioFromPointer = (e) => {
    const rect = trackRef.current.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  };

  const seekToRatio = (ratio) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    video.currentTime = ratio * video.duration;
    setState((s) => ({ ...s, current: video.currentTime }));
  };

  const onPointerDown = (e) => {
    draggingRef.current = true;
    trackRef.current.setPointerCapture(e.pointerId);
    seekToRatio(ratioFromPointer(e));
  };

  const onPointerMove = (e) => {
    const ratio = ratioFromPointer(e);
    setHoverRatio(ratio);
    if (draggingRef.current) seekToRatio(ratio);
  };

  const onPointerUp = (e) => {
    draggingRef.current = false;
    if (trackRef.current.hasPointerCapture(e.pointerId)) trackRef.current.releasePointerCapture(e.pointerId);
  };

  const onKeyDown = (e) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    if (e.key === 'ArrowRight') {
      video.currentTime = Math.min(video.duration, video.currentTime + 0.05);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      video.currentTime = Math.max(0, video.currentTime - 0.05);
      e.preventDefault();
    }
  };

  const progress = state.duration ? state.current / state.duration : 0;

  return (
    <div className="timeline-panel">
      <div className="timeline-controls">
        <button className="tl-btn" onClick={togglePlay} aria-label={state.playing ? 'Pause' : 'Play'}>
          {state.playing ? <Icon.Pause width={16} height={16} /> : <Icon.Play width={16} height={16} />}
        </button>
        <span className="tl-time">
          {formatTime(state.current)}
          <span className="tl-sep"> / </span>
          {formatTime(state.duration)}
        </span>
        <button className="tl-btn tl-mute" onClick={toggleMute} aria-label={state.muted ? 'Unmute' : 'Mute'}>
          {state.muted ? <Icon.Mute width={16} height={16} /> : <Icon.Volume width={16} height={16} />}
        </button>
      </div>

      <div
        ref={trackRef}
        className="timeline-track"
        role="slider"
        tabIndex={0}
        aria-label="Timeline"
        aria-valuemin={0}
        aria-valuemax={Number(state.duration.toFixed(2))}
        aria-valuenow={Number(state.current.toFixed(2))}
        aria-valuetext={formatTime(state.current)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => setHoverRatio(null)}
        onKeyDown={onKeyDown}
      >
        <div className="tl-track-bg" />
        <div className="tl-buffered" style={{ transform: `scaleX(${Math.min(1, state.buffered)})` }} />
        <div className="tl-progress" style={{ transform: `scaleX(${progress})` }} />
        <div className="tl-playhead" style={{ left: `${progress * 100}%` }} />
        {hoverRatio !== null && (
          <div className="tl-hover" style={{ left: `${hoverRatio * 100}%` }}>
            {formatTime(hoverRatio * state.duration)}
          </div>
        )}
      </div>
    </div>
  );
}

function LoaderScreen({ done }) {
  return (
    <div className={`loader ${done ? 'is-done' : ''}`} aria-hidden="true">
      <div className="loader-blocks">
        {Array.from({ length: 9 }, (_, i) => <span key={i} />)}
      </div>
      <div className="loader-word">THEMEFX</div>
    </div>
  );
}

function Background() {
  return (
    <div className="bg" aria-hidden="true">
      <span className="blob blob-yellow" />
      <span className="blob blob-violet" />
      <span className="blob blob-soft" />
      <span className="grid-lines" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

function Topbar({ onToggleSidebar, sidebarOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [notice, setNotice] = useState('');
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const focusSearch = () => {
    const onLibrary = location.pathname === '/';
    if (!onLibrary) navigate('/');
    setTimeout(() => document.getElementById('library-search')?.focus(), onLibrary ? 0 : 350);
  };

  const showNotice = (message) => {
    setNotice(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(''), 2200);
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar" aria-expanded={sidebarOpen}>
          <Icon.Menu />
        </button>
        <Link to="/" className="brand" aria-label="THEMEFX home">
          <img className="brand-mark" src="/logo.png" alt="" width="30" height="30" />
          <span className="brand-name">THEMEFX</span>
        </Link>
      </div>

      <nav className="topnav" aria-label="Main">
        <NavLink to="/" end>All Animations</NavLink>
      </nav>

      <div className="topbar-right">
        <button className="icon-btn" onClick={focusSearch} aria-label="Search animations">
          <Icon.Search />
        </button>
        <button className="icon-btn avatar" onClick={() => showNotice('Accounts are not available yet.')} aria-label="Profile">
          <Icon.User />
        </button>
      </div>

      <div className={`toast ${notice ? 'is-visible' : ''}`} role="status" aria-live="polite">{notice}</div>
    </header>
  );
}

function Sidebar({ onNavigate }) {
  return (
    <aside className="sidebar" aria-label="Sidebar">
      <nav>
        <NavLink to="/" end className="side-link" onClick={onNavigate}>
          <Icon.Grid />
          <span>All Animations</span>
        </NavLink>
      </nav>
    </aside>
  );
}

function AppShell() {
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 860px)');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  const toggleSidebar = () => {
    if (isMobile) setMobileOpen((o) => !o);
    else setCollapsed((c) => !c);
  };

  const sidebarOpen = isMobile ? mobileOpen : !collapsed;
  const shellClass = ['app-shell', collapsed && !isMobile && 'is-collapsed', mobileOpen && 'is-mobile-open']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={shellClass}>
      <Background />
      <Topbar onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
      <Sidebar onNavigate={() => setMobileOpen(false)} />
      {mobileOpen && <button className="sidebar-scrim" aria-label="Close sidebar" onClick={() => setMobileOpen(false)} />}
      <main className="main" id="main">
        <div className="page-transition" key={location.pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */

export function AllAnimations() {
  const [query, setQuery] = useState('');

  const cards = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COLLECTIONS.map((collection) => {
      const items = ANIMATIONS.filter((a) => a.collectionId === collection.id);
      return { collection, items, first: items[0] };
    })
      .filter((c) => c.first)
      .filter((c) => {
        if (!q) return true;
        return c.collection.title.toLowerCase().includes(q) || c.items.some((i) => i.title.toLowerCase().includes(q));
      });
  }, [query]);

  return (
    <section className="page page-library" aria-labelledby="library-title">
      <header className="page-head">
        <h1 id="library-title">ALL ANIMATIONS</h1>
      </header>

      <div className="toolbar">
        <SearchBar value={query} onChange={setQuery} />
      </div>

      {cards.length > 0 ? (
        <div className="grid">
          {cards.map((card, index) => (
            <AnimationCard
              key={card.collection.id}
              to={`/animation/${card.first.id}`}
              title={card.collection.title}
              video={card.first.video}
              poster={card.first.poster}
              mode="autoplay"
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state" role="status">
          <h2>{`No animations match "${query.trim()}"`}</h2>
          <p>Check the spelling or try a shorter name.</p>
          <button className="btn btn-ghost" onClick={() => setQuery('')}>Clear search</button>
        </div>
      )}
    </section>
  );
}

export function AnimationDetail() {
  const { id } = useParams();
  const item = getAnimation(id);
  const videoRef = useRef(null);

  /* Sound on: the click that opened this page allows unmuted playback.
     If the browser still blocks sound, the video starts muted. */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !item) return undefined;
    video.src = item.video;
    video.muted = false;
    video.loop = true;
    const p = video.play();
    if (p && p.catch) {
      p.catch(() => {
        video.muted = true;
        video.play().catch(() => {});
      });
    }
    return () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [item]);

  if (!item) return <NotFound />;

  const collection = getCollection(item.collectionId);
  const related = getCollectionItems(item.collectionId).filter((a) => a.id !== item.id);

  return (
    <section className="page page-detail" aria-labelledby="detail-title">
      <div className="detail-grid">
        <div className="player-col">
          <div className="player-frame">
            <video
              ref={videoRef}
              className="detail-video"
              poster={item.poster}
              playsInline
              controlsList="nodownload noremoteplayback nofullscreen"
              disablePictureInPicture
            />
          </div>
          <VideoTimeline videoRef={videoRef} />
        </div>

        <aside className="info-col">
          <span className="detail-cat">{collection ? collection.title.toUpperCase() : 'ANIMATIONS'}</span>
          <h1 id="detail-title" className="detail-title">{item.title}</h1>
          <p className="detail-desc">{item.description}</p>
          <a className="btn btn-primary download-btn" href={`/downloads/${item.download}`} download={item.download}>
            <Icon.Download />
            <span>Download 4K MP4</span>
          </a>
        </aside>
      </div>

      {related.length > 0 && collection && (
        <div className="related">
          <h2>All {collection.title} Animations</h2>
          <div className="grid">
            {related.map((rel, index) => (
              <AnimationCard
                key={rel.id}
                to={`/animation/${rel.id}`}
                title={rel.title}
                video={rel.video}
                poster={rel.poster}
                mode="hover"
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function NotFound() {
  return (
    <section className="page-state">
      <h1>Page not found</h1>
      <p>This page does not exist.</p>
      <Link to="/" className="btn btn-primary">Back to All Animations</Link>
    </section>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <LoaderScreen done={!loading} />
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<AllAnimations />} />
          <Route path="animation/:id" element={<AnimationDetail />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
