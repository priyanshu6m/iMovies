import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Play,
  ChevronLeft,
  ChevronRight,
  Star,
  TrendingUp,
  Zap,
  Calendar,
  Award,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { movieAPI } from "../services/api";
import { useApp } from "../context/AppContext";
import MovieCard from "../components/MovieCard";
import SectionHeader from "../components/SectionHeader";
import "./Home.css";

const STATS = [
  { icon: <Play size={20} />, value: "500+", label: "Movies Available" },
  { icon: <Award size={20} />, value: "50+", label: "Premium Theatres" },
  { icon: <Star size={20} />, value: "4.9★", label: "Average Rating" },
  { icon: <TrendingUp size={20} />, value: "2M+", label: "Happy Customers" },
];

export default function Home() {
  const [heroIdx, setHeroIdx] = useState(0);
  const [query, setQuery] = useState("");
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { setSearchQuery } = useApp();

  const fetchHomeMovies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await movieAPI.getMovies({ limit: 50 });
      if (data && data.movies) {
        setMovies(data.movies);
      }
    } catch (err) {
      console.error("Failed to fetch home movies:", err);
      setError(err.message || "Failed to load movies from the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeMovies();
  }, []);

  const heroMovies = movies.filter((m) => m.trending).slice(0, 5);
  // Fallback to first few movies if none are marked trending
  const activeHeroList = heroMovies.length > 0 ? heroMovies : movies.slice(0, 5);

  const nowShowing = movies.filter((m) => m.status === "now_showing");
  const upcoming = movies.filter((m) => m.status === "upcoming");
  const trending = movies.filter((m) => m.trending);

  const currentHero = activeHeroList[heroIdx];

  // Auto-advance hero
  useEffect(() => {
    if (activeHeroList.length <= 1) return;
    const t = setInterval(
      () => setHeroIdx((i) => (i + 1) % activeHeroList.length),
      6000
    );
    return () => clearInterval(t);
  }, [activeHeroList.length]);

  useEffect(() => {
    setHeroLoaded(false);
    const t = setTimeout(() => setHeroLoaded(true), 100);
    return () => clearTimeout(t);
  }, [heroIdx]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchQuery(query);
      navigate(`/movies?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="home">
      {/* Loading State */}
      {loading && (
        <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", color: "rgba(255,255,255,0.7)" }}>
          <div className="auth-spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <p>Loading cinematic experiences...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div style={{ minHeight: "50vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", padding: "2rem", textAlign: "center" }}>
          <AlertCircle size={48} color="#e50914" />
          <h2 style={{ color: "#fff", margin: 0 }}>Unable to load movies</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", maxWidth: 500, margin: 0 }}>{error}</p>
          <button
            onClick={fetchHomeMovies}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#e50914",
              color: "#fff",
              border: "none",
              padding: "0.6rem 1.4rem",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      )}

      {/* Main Content when loaded */}
      {!loading && !error && currentHero && (
        <>
          {/* ── Hero ── */}
          <section className="hero" id="home-hero">
            <div
              className={`hero__bg${heroLoaded ? " hero__bg--loaded" : ""}`}
              style={{ backgroundImage: `url(${currentHero.backdrop || currentHero.poster})` }}
            />
            <div className="hero__overlay" />

            <div className="hero__inner">
              {/* Left content */}
              <div className="hero__content">
                <div className="hero__eyebrow">
                  <TrendingUp size={14} />
                  Trending #{heroIdx + 1}
                </div>

                <h1 className="hero__title">{currentHero.title}</h1>

                <div className="hero__meta">
                  <span className="hero__rating">
                    <Star size={15} fill="currentColor" />
                    {currentHero.rating}
                  </span>
                  <span className="hero__dot">·</span>
                  <span>{currentHero.duration}</span>
                  {currentHero.certificate && (
                    <>
                      <span className="hero__dot">·</span>
                      <span>{currentHero.certificate}</span>
                    </>
                  )}
                  {Array.isArray(currentHero.genre) && currentHero.genre.length > 0 && (
                    <>
                      <span className="hero__dot">·</span>
                      {currentHero.genre.slice(0, 2).map((g) => (
                        <span key={g} className="hero__genre">{g}</span>
                      ))}
                    </>
                  )}
                </div>

                <p className="hero__desc">{currentHero.description}</p>

                <div className="hero__actions">
                  <Link
                    to={`/movie/${currentHero._id || currentHero.id}`}
                    className="hero__btn hero__btn--primary"
                    id={`hero-book-${currentHero._id || currentHero.id}`}
                  >
                    Book Tickets · ₹{currentHero.price || 250}
                  </Link>
                  <Link
                    to={`/movie/${currentHero._id || currentHero.id}`}
                    className="hero__btn hero__btn--ghost"
                    id={`hero-details-${currentHero._id || currentHero.id}`}
                  >
                    <Play size={15} fill="currentColor" /> Details
                  </Link>
                </div>
              </div>

              {/* Thumbnails */}
              {activeHeroList.length > 1 && (
                <div className="hero__thumbs">
                  {activeHeroList.map((m, i) => (
                    <button
                      key={m._id || m.id}
                      className={`hero__thumb${i === heroIdx ? " hero__thumb--active" : ""}`}
                      onClick={() => setHeroIdx(i)}
                      id={`hero-thumb-${m._id || m.id}`}
                    >
                      <img src={m.poster} alt={m.title} />
                      <div className="hero__thumb-overlay" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Prev / Next */}
            {activeHeroList.length > 1 && (
              <>
                <button
                  className="hero__nav hero__nav--prev"
                  onClick={() => setHeroIdx((i) => (i - 1 + activeHeroList.length) % activeHeroList.length)}
                  id="hero-prev"
                  aria-label="Previous slide"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  className="hero__nav hero__nav--next"
                  onClick={() => setHeroIdx((i) => (i + 1) % activeHeroList.length)}
                  id="hero-next"
                  aria-label="Next slide"
                >
                  <ChevronRight size={20} />
                </button>

                {/* Dots */}
                <div className="hero__dots">
                  {activeHeroList.map((m, i) => (
                    <button
                      key={m._id || m.id || i}
                      className={`hero__dot-btn${i === heroIdx ? " hero__dot-btn--active" : ""}`}
                      onClick={() => setHeroIdx(i)}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Search bar inside hero */}
            <div className="hero__search-container">
              <form className="hero__search" onSubmit={handleSearch} id="hero-search-form">
                <Search size={20} className="hero__search-icon" />
                <input
                  type="text"
                  id="hero-search-input"
                  placeholder="Search movies, genres, actors…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="hero__search-input"
                />
                <button type="submit" className="hero__search-btn" id="hero-search-btn">
                  Search
                </button>
              </form>
            </div>
          </section>

          {/* ── Stats ── */}
          <section className="home__stats">
            {STATS.map((s) => (
              <div key={s.label} className="home__stat">
                <div className="home__stat-icon">{s.icon}</div>
                <div>
                  <div className="home__stat-value">{s.value}</div>
                  <div className="home__stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </section>

          {/* ── Now Showing ── */}
          {nowShowing.length > 0 && (
            <section className="home__section" id="section-now-showing">
              <div className="home__section-inner">
                <SectionHeader
                  eyebrow="In Cinemas"
                  title="Now Showing"
                  viewAllLink="/movies?filter=now_showing"
                />
                <div className="home__grid home__grid--4">
                  {nowShowing.slice(0, 8).map((m) => (
                    <MovieCard key={m._id || m.id} movie={m} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── Trending Banner ── */}
          {trending.length > 0 && (
            <section className="home__trending-banner" id="section-trending">
              <div className="home__trending-inner">
                <div className="home__trending-text">
                  <Zap size={22} className="home__trending-icon" />
                  <div>
                    <h2>🔥 Trending This Week</h2>
                    <p>Blockbusters everyone's talking about</p>
                  </div>
                </div>
                <div className="home__trending-cards">
                  {trending.slice(0, 4).map((m, i) => {
                    const mId = m._id || m.id;
                    return (
                      <Link to={`/movie/${mId}`} key={mId} className="home__trending-card" id={`trending-card-${mId}`}>
                        <span className="home__trending-rank">#{i + 1}</span>
                        <img src={m.poster} alt={m.title} />
                        <div className="home__trending-info">
                          <strong>{m.title}</strong>
                          <span>
                            <Star size={12} fill="#FFD700" color="#FFD700" /> {m.rating}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* ── Upcoming ── */}
          {upcoming.length > 0 && (
            <section className="home__section" id="section-upcoming">
              <div className="home__section-inner">
                <SectionHeader
                  eyebrow="Coming Soon"
                  title="Upcoming Movies"
                  viewAllLink="/movies?filter=upcoming"
                />
                <div className="home__grid home__grid--4">
                  {upcoming.slice(0, 4).map((m) => (
                    <MovieCard key={m._id || m.id} movie={m} />
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* ── CTA Banner ── */}
      <section className="home__cta" id="section-cta">
        <div className="home__cta-glow" />
        <div className="home__cta-inner">
          <Calendar size={40} className="home__cta-icon" />
          <h2>Never Miss a Premier Again</h2>
          <p>
            Sign up for iMovies and get early access, exclusive offers, and personalised
            recommendations delivered straight to you.
          </p>
          <div className="home__cta-actions">
            <Link to="/register" className="cta-btn cta-btn--primary" id="cta-register-btn">
              Get Started — It's Free
            </Link>
            <Link to="/movies" className="cta-btn cta-btn--ghost" id="cta-browse-btn">
              Browse Movies
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
