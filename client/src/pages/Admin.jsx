import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Film,
  Building2,
  Calendar,
  Clock,
  Shield,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  X,
  Search,
  Sparkles,
  DollarSign,
  MapPin,
  Layers,
  ArrowRight,
  TrendingUp,
  Tag,
  Star,
  RefreshCw,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { movieAPI, theatreAPI, showtimeAPI, authAPI } from "../services/api";
import "./Admin.css";

// Sample presets for quick testing
const MOVIE_PRESETS = [
  {
    title: "Avatar: Fire and Ash",
    description: "Jake Sully and Neytiri encounter a new, aggressive volcanic clan of Na'vi known as the Ash People on Pandora.",
    genre: "Action, Sci-Fi, Adventure",
    language: "English",
    duration: "3h 10m",
    certificate: "UA",
    releaseDate: "2025-12-19",
    rating: 8.8,
    price: 350,
    director: "James Cameron",
    cast: "Sam Worthington, Zoe Saldana, Sigourney Weaver",
    poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80",
    backdrop: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80",
    trailerUrl: "https://www.youtube.com/watch?v=d9MyW72ELq0",
    status: "upcoming",
    trending: true,
  },
  {
    title: "Oppenheimer: Directors Cut",
    description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
    genre: "Biography, Drama, History",
    language: "English",
    duration: "3h 05m",
    certificate: "A",
    releaseDate: "2024-07-21",
    rating: 8.9,
    price: 300,
    director: "Christopher Nolan",
    cast: "Cillian Murphy, Emily Blunt, Matt Damon, Robert Downey Jr.",
    poster: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&auto=format&fit=crop&q=80",
    backdrop: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1600&auto=format&fit=crop&q=80",
    trailerUrl: "https://www.youtube.com/watch?v=uYPbbksJxIg",
    status: "now_showing",
    trending: true,
  },
];

const THEATRE_PRESETS = [
  {
    name: "PVR Directors Cut",
    city: "New Delhi",
    address: "Ambience Mall, Vasant Kunj",
    location: "Vasant Kunj, New Delhi",
    amenities: "IMAX Laser, Dolby Atmos, VIP Lounge, Recliner",
    rating: 4.9,
  },
  {
    name: "Cinepolis VIP",
    city: "Mumbai",
    address: "Andheri West, Link Road",
    location: "Andheri West, Mumbai",
    amenities: "4DX, Dolby Atmos, RealD 3D, Gourmet Dining",
    rating: 4.8,
  },
];

export default function Admin() {
  const { user, login: loginContext, updateUser } = useApp();
  const navigate = useNavigate();

  // Active tab: 'overview' | 'movies' | 'theatres' | 'showtimes'
  const [activeTab, setActiveTab] = useState("overview");

  // State collections
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [screensMap, setScreensMap] = useState({}); // theatreId -> screens array
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [showTheatreModal, setShowTheatreModal] = useState(false);
  const [showShowtimeModal, setShowShowtimeModal] = useState(false);
  const [showScreenModal, setShowScreenModal] = useState(false);
  const [selectedTheatreForScreen, setSelectedTheatreForScreen] = useState(null);

  // Notifications / Toast
  const [toast, setToast] = useState(null);

  // Admin secret promotion input for non-admin logged-in users
  const [adminSecretInput, setAdminSecretInput] = useState("");
  const [adminAuthError, setAdminAuthError] = useState("");

  // Form States
  const [movieForm, setMovieForm] = useState({
    title: "",
    description: "",
    genre: "Action, Adventure",
    language: "English",
    duration: "2h 15m",
    certificate: "UA",
    releaseDate: new Date().toISOString().split("T")[0],
    rating: "8.5",
    price: "250",
    director: "",
    cast: "",
    poster: "",
    backdrop: "",
    trailerUrl: "",
    status: "now_showing",
    trending: false,
  });

  const [theatreForm, setTheatreForm] = useState({
    name: "",
    city: "New Delhi",
    address: "",
    location: "",
    amenities: "IMAX, Dolby Atmos, 4K Projection, Recliner Seats",
    rating: "4.7",
  });

  const [screenForm, setScreenForm] = useState({
    name: "Screen 3",
    screenType: "IMAX",
  });

  const [showtimeForm, setShowtimeForm] = useState({
    movieId: "",
    theatreId: "",
    screenId: "",
    startTime: "",
    silverPrice: "180",
    goldPrice: "250",
    premiumPrice: "350",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch all administration data
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [moviesRes, theatresRes, showtimesRes] = await Promise.allSettled([
        movieAPI.getMovies({ limit: 100 }),
        theatreAPI.getTheatres({ activeOnly: "false" }),
        showtimeAPI.getShowtimes(),
      ]);

      if (moviesRes.status === "fulfilled" && moviesRes.value?.movies) {
        setMovies(moviesRes.value.movies);
      }
      if (theatresRes.status === "fulfilled" && theatresRes.value?.theatres) {
        setTheatres(theatresRes.value.theatres);
      }
      if (showtimesRes.status === "fulfilled" && showtimesRes.value?.showtimes) {
        setShowtimes(showtimesRes.value.showtimes);
      }
    } catch (err) {
      console.error("Admin data fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchAllData();
    }
  }, [user, fetchAllData]);

  // When a theatre is selected in showtime form, load its screens
  const handleTheatreSelectInShowtime = async (theatreId) => {
    setShowtimeForm((prev) => ({ ...prev, theatreId, screenId: "" }));
    if (!theatreId) return;

    if (!screensMap[theatreId]) {
      try {
        const res = await theatreAPI.getTheatreScreens(theatreId);
        if (res && res.screens) {
          setScreensMap((prev) => ({ ...prev, [theatreId]: res.screens }));
          if (res.screens.length > 0) {
            setShowtimeForm((prev) => ({ ...prev, screenId: res.screens[0]._id }));
          }
        }
      } catch (err) {
        console.error("Failed to load screens for theatre:", err);
      }
    } else {
      const existing = screensMap[theatreId];
      if (existing && existing.length > 0) {
        setShowtimeForm((prev) => ({ ...prev, screenId: existing[0]._id }));
      }
    }
  };

  // Quick Demo Admin Login
  const handleDemoAdminLogin = async () => {
    setActionLoading(true);
    setAdminAuthError("");
    try {
      const res = await authAPI.login({
        email: "admin@imovies.in",
        password: "admin123",
      });
      if (res && res.user) {
        loginContext(res.user, res.token);
        showToast("Logged in as Administrator");
      }
    } catch (err) {
      setAdminAuthError(err.message || "Could not sign in with demo admin credentials.");
    } finally {
      setActionLoading(false);
    }
  };

  // Upgrade logged-in user to admin using secret key
  const handleUpgradeToAdmin = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setAdminAuthError("");
    try {
      const res = await authAPI.upgradeToAdmin(adminSecretInput.trim() || "admin123");
      if (res && res.user) {
        updateUser(res.user);
        showToast("Your account has been upgraded to Administrator!");
      }
    } catch (err) {
      setAdminAuthError(err.message || "Failed to verify admin key. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // ── MOVIE HANDLERS ────────────────────────────────────────────────────────
  const handleCreateMovie = async (e) => {
    e.preventDefault();
    if (!movieForm.title.trim()) {
      showToast("Please provide a movie title", "error");
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        title: movieForm.title.trim(),
        description: movieForm.description.trim(),
        genre: movieForm.genre,
        language: movieForm.language,
        duration: movieForm.duration,
        certificate: movieForm.certificate,
        releaseDate: movieForm.releaseDate,
        rating: Number(movieForm.rating) || 8.0,
        price: Number(movieForm.price) || 250,
        director: movieForm.director,
        cast: movieForm.cast,
        poster: movieForm.poster.trim(),
        backdrop: movieForm.backdrop.trim(),
        trailerUrl: movieForm.trailerUrl.trim(),
        status: movieForm.status,
        trending: movieForm.trending,
      };

      const res = await movieAPI.createMovie(payload);
      if (res && res.movie) {
        showToast(`Movie "${res.movie.title}" added successfully!`);
        setShowMovieModal(false);
        // Reset form
        setMovieForm({
          title: "",
          description: "",
          genre: "Action, Adventure",
          language: "English",
          duration: "2h 15m",
          certificate: "UA",
          releaseDate: new Date().toISOString().split("T")[0],
          rating: "8.5",
          price: "250",
          director: "",
          cast: "",
          poster: "",
          backdrop: "",
          trailerUrl: "",
          status: "now_showing",
          trending: false,
        });
        fetchAllData();
      }
    } catch (err) {
      showToast(err.message || "Failed to create movie", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMovie = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await movieAPI.deleteMovie(id);
      showToast(`Movie "${title}" removed.`);
      setMovies((prev) => prev.filter((m) => m._id !== id && m.id !== id));
    } catch (err) {
      showToast(err.message || "Failed to delete movie", "error");
    }
  };

  // ── THEATRE HANDLERS ──────────────────────────────────────────────────────
  const handleCreateTheatre = async (e) => {
    e.preventDefault();
    if (!theatreForm.name.trim() || !theatreForm.city.trim()) {
      showToast("Theatre name and city are required", "error");
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        name: theatreForm.name.trim(),
        city: theatreForm.city.trim(),
        address: theatreForm.address.trim() || `${theatreForm.city.trim()} City Center`,
        location: theatreForm.location.trim() || `${theatreForm.address.trim()}, ${theatreForm.city.trim()}`,
        amenities: theatreForm.amenities.split(",").map((a) => a.trim()).filter(Boolean),
        rating: Number(theatreForm.rating) || 4.5,
      };

      const res = await theatreAPI.createTheatre(payload);
      if (res && res.theatre) {
        showToast(`Theatre "${res.theatre.name}" added successfully with default screens!`);
        setShowTheatreModal(false);
        setTheatreForm({
          name: "",
          city: "New Delhi",
          address: "",
          location: "",
          amenities: "IMAX, Dolby Atmos, 4K Projection, Recliner Seats",
          rating: "4.7",
        });
        fetchAllData();
      }
    } catch (err) {
      showToast(err.message || "Failed to create theatre", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTheatre = async (id, name) => {
    if (!window.confirm(`Delete theatre "${name}" and all associated screens?`)) return;
    try {
      await theatreAPI.deleteTheatre(id, { soft: false });
      showToast(`Theatre "${name}" deleted.`);
      setTheatres((prev) => prev.filter((t) => t._id !== id && t.id !== id));
    } catch (err) {
      showToast(err.message || "Failed to delete theatre", "error");
    }
  };

  const handleAddScreen = async (e) => {
    e.preventDefault();
    if (!selectedTheatreForScreen) return;
    setActionLoading(true);
    try {
      const res = await theatreAPI.createScreen(selectedTheatreForScreen._id, screenForm);
      if (res && res.screen) {
        showToast(`Screen "${res.screen.name}" added to ${selectedTheatreForScreen.name}!`);
        setShowScreenModal(false);
        // Refresh screens cache for this theatre
        const fresh = await theatreAPI.getTheatreScreens(selectedTheatreForScreen._id);
        if (fresh && fresh.screens) {
          setScreensMap((prev) => ({ ...prev, [selectedTheatreForScreen._id]: fresh.screens }));
        }
      }
    } catch (err) {
      showToast(err.message || "Failed to add screen", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ── SHOWTIME HANDLERS ─────────────────────────────────────────────────────
  const handleCreateShowtime = async (e) => {
    e.preventDefault();
    if (!showtimeForm.movieId || !showtimeForm.theatreId || !showtimeForm.screenId || !showtimeForm.startTime) {
      showToast("Please fill in movie, theatre, screen, and date/time", "error");
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        movieId: showtimeForm.movieId,
        theatreId: showtimeForm.theatreId,
        screenId: showtimeForm.screenId,
        startTime: new Date(showtimeForm.startTime).toISOString(),
        pricing: {
          silver: Number(showtimeForm.silverPrice) || 180,
          gold: Number(showtimeForm.goldPrice) || 250,
          premium: Number(showtimeForm.premiumPrice) || 350,
        },
      };

      const res = await showtimeAPI.createShowtime(payload);
      if (res && res.showtime) {
        showToast("Showtime successfully scheduled!");
        setShowShowtimeModal(false);
        fetchAllData();
      }
    } catch (err) {
      showToast(err.message || "Failed to schedule showtime", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteShowtime = async (id) => {
    if (!window.confirm("Cancel and delete this showtime?")) return;
    try {
      await showtimeAPI.deleteShowtime(id, { soft: false });
      showToast("Showtime deleted.");
      setShowtimes((prev) => prev.filter((s) => s._id !== id && s.id !== id));
    } catch (err) {
      showToast(err.message || "Failed to delete showtime", "error");
    }
  };

  // ── NON-ADMIN OR UNAUTHENTICATED GUARD ─────────────────────────────────────
  if (!user || user.role !== "admin") {
    return (
      <div className="admin-auth-page">
        <div className="admin-auth-card">
          <div className="admin-auth-header">
            <div className="admin-shield-icon">
              <Shield size={36} />
            </div>
            <h1>Admin Portal Access</h1>
            <p>
              Administrative privileges are required to add and manage movies, theatres, screens, and showtimes.
            </p>
          </div>

          {adminAuthError && (
            <div className="admin-alert admin-alert--error">
              <AlertCircle size={18} />
              <span>{adminAuthError}</span>
            </div>
          )}

          {user ? (
            <div className="admin-upgrade-box">
              <p className="admin-upgrade-desc">
                Logged in as <strong>{user.email}</strong>. Enter the administrator secret key to elevate this account to Admin:
              </p>
              <form onSubmit={handleUpgradeToAdmin} className="admin-upgrade-form">
                <input
                  type="password"
                  placeholder="Enter Secret Key (default: admin123)"
                  value={adminSecretInput}
                  onChange={(e) => setAdminSecretInput(e.target.value)}
                  className="admin-input"
                />
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="admin-btn admin-btn--primary"
                >
                  {actionLoading ? "Verifying..." : "Activate Admin Mode"}
                </button>
              </form>
            </div>
          ) : (
            <div className="admin-quick-login">
              <button
                onClick={handleDemoAdminLogin}
                disabled={actionLoading}
                className="admin-btn admin-btn--primary admin-btn--full"
              >
                {actionLoading ? "Signing in..." : "⚡ One-Click Login as Admin (admin@imovies.in)"}
              </button>
              <div className="admin-divider">or</div>
              <Link to="/login" className="admin-btn admin-btn--ghost admin-btn--full">
                Sign In with Existing Account
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`admin-toast admin-toast--${toast.type}`}>
          {toast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Admin Top Banner */}
      <header className="admin-header">
        <div className="admin-header__inner">
          <div className="admin-header__title-group">
            <div className="admin-header__badge">
              <Shield size={14} /> ADMINISTRATOR
            </div>
            <h1>Management Dashboard</h1>
            <p>Create and orchestrate movies, cinemas, screens, and ticket schedules.</p>
          </div>

          <div className="admin-header__actions">
            <button
              onClick={() => {
                setMovieForm((prev) => ({ ...prev, ...MOVIE_PRESETS[0] }));
                setShowMovieModal(true);
              }}
              className="admin-action-pill"
            >
              <Plus size={16} /> Add Movie
            </button>
            <button
              onClick={() => setShowTheatreModal(true)}
              className="admin-action-pill"
            >
              <Plus size={16} /> Add Theatre
            </button>
            <button
              onClick={() => {
                if (movies.length > 0 && !showtimeForm.movieId) {
                  setShowtimeForm((p) => ({ ...p, movieId: movies[0]._id }));
                }
                if (theatres.length > 0 && !showtimeForm.theatreId) {
                  handleTheatreSelectInShowtime(theatres[0]._id);
                }
                setShowShowtimeModal(true);
              }}
              className="admin-action-pill admin-action-pill--accent"
            >
              <Clock size={16} /> Schedule Show
            </button>
            <button
              onClick={fetchAllData}
              title="Refresh all data"
              className="admin-refresh-btn"
            >
              <RefreshCw size={17} className={loading ? "admin-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="admin-nav-tabs">
          <button
            className={`admin-tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <TrendingUp size={16} /> Overview
          </button>
          <button
            className={`admin-tab-btn ${activeTab === "movies" ? "active" : ""}`}
            onClick={() => setActiveTab("movies")}
          >
            <Film size={16} /> Movies ({movies.length})
          </button>
          <button
            className={`admin-tab-btn ${activeTab === "theatres" ? "active" : ""}`}
            onClick={() => setActiveTab("theatres")}
          >
            <Building2 size={16} /> Theatres ({theatres.length})
          </button>
          <button
            className={`admin-tab-btn ${activeTab === "showtimes" ? "active" : ""}`}
            onClick={() => setActiveTab("showtimes")}
          >
            <Calendar size={16} /> Showtimes ({showtimes.length})
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="admin-main">
        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div className="admin-overview">
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-icon admin-stat-icon--red">
                  <Film size={24} />
                </div>
                <div className="admin-stat-details">
                  <span className="admin-stat-number">{movies.length}</span>
                  <span className="admin-stat-label">Total Movies</span>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon admin-stat-icon--gold">
                  <Building2 size={24} />
                </div>
                <div className="admin-stat-details">
                  <span className="admin-stat-number">{theatres.length}</span>
                  <span className="admin-stat-label">Theatres Operating</span>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon admin-stat-icon--blue">
                  <Calendar size={24} />
                </div>
                <div className="admin-stat-details">
                  <span className="admin-stat-number">{showtimes.length}</span>
                  <span className="admin-stat-label">Scheduled Shows</span>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon admin-stat-icon--green">
                  <Sparkles size={24} />
                </div>
                <div className="admin-stat-details">
                  <span className="admin-stat-number">
                    {movies.filter((m) => m.status === "now_showing").length}
                  </span>
                  <span className="admin-stat-label">Now Showing</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <section className="admin-section">
              <div className="admin-section-header">
                <h2>Quick Management Actions</h2>
                <p>Launch modals to add new catalogue items instantly.</p>
              </div>

              <div className="admin-quick-cards">
                <div
                  className="admin-quick-card"
                  onClick={() => {
                    setMovieForm((prev) => ({ ...prev, ...MOVIE_PRESETS[0] }));
                    setShowMovieModal(true);
                  }}
                >
                  <div className="admin-quick-card-icon">
                    <Film size={28} />
                  </div>
                  <h3>Add a New Movie</h3>
                  <p>Publish a now-showing or upcoming blockbuster with poster, cast, and pricing.</p>
                  <span className="admin-quick-card-link">
                    Open Movie Creator <ArrowRight size={14} />
                  </span>
                </div>

                <div
                  className="admin-quick-card"
                  onClick={() => setShowTheatreModal(true)}
                >
                  <div className="admin-quick-card-icon">
                    <Building2 size={28} />
                  </div>
                  <h3>Add Cinema Theatre</h3>
                  <p>Register a theatre location, city, luxury amenities, and screen setups.</p>
                  <span className="admin-quick-card-link">
                    Add Theatre <ArrowRight size={14} />
                  </span>
                </div>

                <div
                  className="admin-quick-card"
                  onClick={() => {
                    if (movies.length > 0 && !showtimeForm.movieId) {
                      setShowtimeForm((p) => ({ ...p, movieId: movies[0]._id }));
                    }
                    if (theatres.length > 0 && !showtimeForm.theatreId) {
                      handleTheatreSelectInShowtime(theatres[0]._id);
                    }
                    setShowShowtimeModal(true);
                  }}
                >
                  <div className="admin-quick-card-icon">
                    <Clock size={28} />
                  </div>
                  <h3>Schedule Showtime</h3>
                  <p>Assign movies to screens at specific dates and times with tiered seat pricing.</p>
                  <span className="admin-quick-card-link">
                    Schedule Show <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </section>

            {/* Recent Movies Preview */}
            <section className="admin-section">
              <div className="admin-section-header">
                <h2>Recently Added Movies</h2>
                <button
                  className="admin-link-btn"
                  onClick={() => setActiveTab("movies")}
                >
                  View All ({movies.length}) →
                </button>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Movie</th>
                      <th>Language</th>
                      <th>Duration</th>
                      <th>Rating</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movies.slice(0, 5).map((m) => (
                      <tr key={m._id || m.id}>
                        <td className="admin-movie-cell">
                          <img
                            src={m.poster}
                            alt={m.title}
                            className="admin-mini-poster"
                          />
                          <div>
                            <strong>{m.title}</strong>
                            <small>{Array.isArray(m.genre) ? m.genre.join(", ") : m.genre}</small>
                          </div>
                        </td>
                        <td>{m.language}</td>
                        <td>{m.duration}</td>
                        <td>
                          <span className="admin-rating-badge">
                            <Star size={12} fill="currentColor" /> {m.rating}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-status-pill admin-status-pill--${m.status}`}>
                            {m.status === "now_showing" ? "Now Showing" : "Upcoming"}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleDeleteMovie(m._id || m.id, m.title)}
                            className="admin-icon-btn admin-icon-btn--danger"
                            title="Delete movie"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ── MOVIES TAB ── */}
        {activeTab === "movies" && (
          <div className="admin-tab-content">
            <div className="admin-content-toolbar">
              <h2>Movie Catalogue ({movies.length})</h2>
              <button
                onClick={() => {
                  setMovieForm((prev) => ({ ...prev, ...MOVIE_PRESETS[0] }));
                  setShowMovieModal(true);
                }}
                className="admin-btn admin-btn--primary"
              >
                <Plus size={16} /> Add New Movie
              </button>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Movie</th>
                    <th>Genre & Cast</th>
                    <th>Language</th>
                    <th>Duration</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {movies.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="admin-empty-cell">
                        No movies found in the database. Click "+ Add New Movie" to add one!
                      </td>
                    </tr>
                  ) : (
                    movies.map((m) => (
                      <tr key={m._id || m.id}>
                        <td className="admin-movie-cell">
                          <img
                            src={m.poster}
                            alt={m.title}
                            className="admin-mini-poster"
                          />
                          <div>
                            <strong>{m.title}</strong>
                            <small>Directed by {m.director || "Unknown"}</small>
                          </div>
                        </td>
                        <td>
                          <div className="admin-tags-wrap">
                            {(Array.isArray(m.genre) ? m.genre : [m.genre]).slice(0, 2).map((g, idx) => (
                              <span key={idx} className="admin-tag">{g}</span>
                            ))}
                          </div>
                        </td>
                        <td>{m.language}</td>
                        <td>{m.duration}</td>
                        <td>₹{m.price || 250}</td>
                        <td>
                          <span className={`admin-status-pill admin-status-pill--${m.status}`}>
                            {m.status === "now_showing" ? "Now Showing" : "Upcoming"}
                          </span>
                        </td>
                        <td>
                          <div className="admin-row-actions">
                            <Link
                              to={`/movie/${m._id || m.id}`}
                              target="_blank"
                              className="admin-icon-btn"
                              title="View user page"
                            >
                              <ExternalLink size={15} />
                            </Link>
                            <button
                              onClick={() => handleDeleteMovie(m._id || m.id, m.title)}
                              className="admin-icon-btn admin-icon-btn--danger"
                              title="Delete Movie"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── THEATRES TAB ── */}
        {activeTab === "theatres" && (
          <div className="admin-tab-content">
            <div className="admin-content-toolbar">
              <h2>Cinemas & Screens ({theatres.length})</h2>
              <button
                onClick={() => setShowTheatreModal(true)}
                className="admin-btn admin-btn--primary"
              >
                <Plus size={16} /> Add New Theatre
              </button>
            </div>

            <div className="admin-theatres-grid">
              {theatres.length === 0 ? (
                <div className="admin-empty-state">
                  <Building2 size={40} />
                  <p>No theatres added yet. Create your first theatre to start hosting showtimes.</p>
                </div>
              ) : (
                theatres.map((t) => (
                  <div key={t._id || t.id} className="admin-theatre-card">
                    <div className="admin-theatre-card-header">
                      <div>
                        <h3>{t.name}</h3>
                        <p className="admin-theatre-city">
                          <MapPin size={13} /> {t.city} • {t.address}
                        </p>
                      </div>
                      <span className="admin-rating-badge">
                        <Star size={12} fill="currentColor" /> {t.rating || 4.5}
                      </span>
                    </div>

                    <div className="admin-theatre-amenities">
                      {(t.amenities || []).map((a, idx) => (
                        <span key={idx} className="admin-amenity-tag">
                          {a}
                        </span>
                      ))}
                    </div>

                    <div className="admin-theatre-card-footer">
                      <button
                        onClick={() => {
                          setSelectedTheatreForScreen(t);
                          setShowScreenModal(true);
                        }}
                        className="admin-btn admin-btn--sm admin-btn--ghost"
                      >
                        <Layers size={14} /> + Add Screen
                      </button>
                      <button
                        onClick={() => handleDeleteTheatre(t._id || t.id, t.name)}
                        className="admin-icon-btn admin-icon-btn--danger"
                        title="Delete Theatre"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── SHOWTIMES TAB ── */}
        {activeTab === "showtimes" && (
          <div className="admin-tab-content">
            <div className="admin-content-toolbar">
              <h2>Scheduled Showtimes ({showtimes.length})</h2>
              <button
                onClick={() => {
                  if (movies.length > 0 && !showtimeForm.movieId) {
                    setShowtimeForm((p) => ({ ...p, movieId: movies[0]._id }));
                  }
                  if (theatres.length > 0 && !showtimeForm.theatreId) {
                    handleTheatreSelectInShowtime(theatres[0]._id);
                  }
                  setShowShowtimeModal(true);
                }}
                className="admin-btn admin-btn--primary"
              >
                <Plus size={16} /> Schedule Showtime
              </button>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Movie</th>
                    <th>Cinema & Screen</th>
                    <th>Date & Time</th>
                    <th>Pricing Tiers</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {showtimes.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="admin-empty-cell">
                        No showtimes scheduled yet. Click "+ Schedule Showtime" to assign movies to screens.
                      </td>
                    </tr>
                  ) : (
                    showtimes.map((st) => (
                      <tr key={st._id || st.id}>
                        <td className="admin-movie-cell">
                          {st.movie?.poster && (
                            <img
                              src={st.movie.poster}
                              alt={st.movie.title}
                              className="admin-mini-poster"
                            />
                          )}
                          <div>
                            <strong>{st.movie?.title || "Movie Removed"}</strong>
                            <small>{st.movie?.duration || "N/A"}</small>
                          </div>
                        </td>
                        <td>
                          <strong>{st.theatre?.name || "Theatre"}</strong>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            {st.screen?.name || "Standard Screen"} ({st.screen?.screenType || "Standard"})
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>
                            {new Date(st.startTime).toLocaleDateString("en-IN", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </div>
                          <small style={{ color: "var(--accent)" }}>
                            {new Date(st.startTime).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </small>
                        </td>
                        <td>
                          <div className="admin-pricing-pills">
                            <span>S: ₹{st.pricing?.silver || 180}</span>
                            <span>G: ₹{st.pricing?.gold || 250}</span>
                            <span>P: ₹{st.pricing?.premium || 350}</span>
                          </div>
                        </td>
                        <td>
                          <span className="admin-status-pill admin-status-pill--now_showing">
                            Active
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleDeleteShowtime(st._id || st.id)}
                            className="admin-icon-btn admin-icon-btn--danger"
                            title="Delete showtime"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL: CREATE MOVIE ── */}
      {showMovieModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal admin-modal--lg">
            <div className="admin-modal-header">
              <div>
                <h2>Add New Movie</h2>
                <p>Provide movie details or pick a quick preset below.</p>
              </div>
              <button
                onClick={() => setShowMovieModal(false)}
                className="admin-modal-close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Presets Bar */}
            <div className="admin-presets-bar">
              <span className="admin-presets-label">⚡ Quick Fill Presets:</span>
              {MOVIE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMovieForm((prev) => ({ ...prev, ...preset }))}
                  className="admin-preset-chip"
                >
                  {preset.title}
                </button>
              ))}
            </div>

            <form onSubmit={handleCreateMovie} className="admin-form">
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Movie Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Inception 2"
                    value={movieForm.title}
                    onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Release Date *</label>
                  <input
                    type="date"
                    required
                    value={movieForm.releaseDate}
                    onChange={(e) => setMovieForm({ ...movieForm, releaseDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Genre(s) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Action, Sci-Fi, Thriller"
                    value={movieForm.genre}
                    onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Language *</label>
                  <input
                    type="text"
                    required
                    placeholder="English, Hindi"
                    value={movieForm.language}
                    onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-form-row admin-form-row--3">
                <div className="admin-form-group">
                  <label>Duration *</label>
                  <input
                    type="text"
                    placeholder="e.g. 2h 25m"
                    value={movieForm.duration}
                    onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Certificate</label>
                  <select
                    value={movieForm.certificate}
                    onChange={(e) => setMovieForm({ ...movieForm, certificate: e.target.value })}
                  >
                    <option value="U">U (Universal)</option>
                    <option value="UA">UA (Parental Guidance)</option>
                    <option value="A">A (Adult 18+)</option>
                    <option value="R">R (Restricted)</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Base Ticket Price (₹)</label>
                  <input
                    type="number"
                    value={movieForm.price}
                    onChange={(e) => setMovieForm({ ...movieForm, price: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Director</label>
                  <input
                    type="text"
                    placeholder="Christopher Nolan"
                    value={movieForm.director}
                    onChange={(e) => setMovieForm({ ...movieForm, director: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Cast Members</label>
                  <input
                    type="text"
                    placeholder="Actor One, Actor Two"
                    value={movieForm.cast}
                    onChange={(e) => setMovieForm({ ...movieForm, cast: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Poster Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={movieForm.poster}
                    onChange={(e) => setMovieForm({ ...movieForm, poster: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Backdrop Banner URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={movieForm.backdrop}
                    onChange={(e) => setMovieForm({ ...movieForm, backdrop: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Status</label>
                  <select
                    value={movieForm.status}
                    onChange={(e) => setMovieForm({ ...movieForm, status: e.target.value })}
                  >
                    <option value="now_showing">Now Showing</option>
                    <option value="upcoming">Upcoming</option>
                  </select>
                </div>
                <div className="admin-form-group" style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingTop: "1.8rem" }}>
                  <input
                    type="checkbox"
                    id="movie-trending"
                    checked={movieForm.trending}
                    onChange={(e) => setMovieForm({ ...movieForm, trending: e.target.checked })}
                    style={{ width: "20px", height: "20px", cursor: "pointer" }}
                  />
                  <label htmlFor="movie-trending" style={{ cursor: "pointer", margin: 0 }}>
                    Feature in Trending This Week
                  </label>
                </div>
              </div>

              <div className="admin-form-group">
                <label>Movie Synopsis / Description</label>
                <textarea
                  rows="3"
                  placeholder="Enter a compelling overview of the movie..."
                  value={movieForm.description}
                  onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                />
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowMovieModal(false)}
                  className="admin-btn admin-btn--ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="admin-btn admin-btn--primary"
                >
                  {actionLoading ? "Saving Movie..." : "Publish Movie"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE THEATRE ── */}
      {showTheatreModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <div>
                <h2>Add Cinema Theatre</h2>
                <p>Register a new cinema theatre location.</p>
              </div>
              <button
                onClick={() => setShowTheatreModal(false)}
                className="admin-modal-close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Presets Bar */}
            <div className="admin-presets-bar">
              <span className="admin-presets-label">⚡ Presets:</span>
              {THEATRE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTheatreForm((prev) => ({ ...prev, ...preset }))}
                  className="admin-preset-chip"
                >
                  {preset.name}
                </button>
              ))}
            </div>

            <form onSubmit={handleCreateTheatre} className="admin-form">
              <div className="admin-form-group">
                <label>Theatre Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PVR Vegas Mall"
                  value={theatreForm.name}
                  onChange={(e) => setTheatreForm({ ...theatreForm, name: e.target.value })}
                />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    required
                    placeholder="New Delhi, Mumbai, Bengaluru..."
                    value={theatreForm.city}
                    onChange={(e) => setTheatreForm({ ...theatreForm, city: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={theatreForm.rating}
                    onChange={(e) => setTheatreForm({ ...theatreForm, rating: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Address / Mall</label>
                <input
                  type="text"
                  placeholder="Sector 14, Dwarka"
                  value={theatreForm.address}
                  onChange={(e) => setTheatreForm({ ...theatreForm, address: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Amenities (comma separated)</label>
                <input
                  type="text"
                  placeholder="IMAX, Dolby Atmos, 4K Projection, Recliner Seats"
                  value={theatreForm.amenities}
                  onChange={(e) => setTheatreForm({ ...theatreForm, amenities: e.target.value })}
                />
              </div>

              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                💡 Default screens (Screen 1 - Dolby Atmos & Screen 2 - Standard) will be created automatically.
              </p>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowTheatreModal(false)}
                  className="admin-btn admin-btn--ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="admin-btn admin-btn--primary"
                >
                  {actionLoading ? "Creating..." : "Create Theatre"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: SCHEDULE SHOWTIME ── */}
      {showShowtimeModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <div>
                <h2>Schedule Showtime</h2>
                <p>Assign a movie to a theatre screen and set ticket prices.</p>
              </div>
              <button
                onClick={() => setShowShowtimeModal(false)}
                className="admin-modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateShowtime} className="admin-form">
              <div className="admin-form-group">
                <label>Select Movie *</label>
                <select
                  required
                  value={showtimeForm.movieId}
                  onChange={(e) => setShowtimeForm({ ...showtimeForm, movieId: e.target.value })}
                >
                  <option value="">-- Choose a movie --</option>
                  {movies.map((m) => (
                    <option key={m._id || m.id} value={m._id || m.id}>
                      {m.title} ({m.language}) - {m.duration}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label>Select Theatre *</label>
                <select
                  required
                  value={showtimeForm.theatreId}
                  onChange={(e) => handleTheatreSelectInShowtime(e.target.value)}
                >
                  <option value="">-- Choose a theatre --</option>
                  {theatres.map((t) => (
                    <option key={t._id || t.id} value={t._id || t.id}>
                      {t.name} ({t.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label>Select Screen *</label>
                <select
                  required
                  value={showtimeForm.screenId}
                  onChange={(e) => setShowtimeForm({ ...showtimeForm, screenId: e.target.value })}
                >
                  <option value="">-- Select Screen --</option>
                  {(screensMap[showtimeForm.theatreId] || []).map((scr) => (
                    <option key={scr._id || scr.id} value={scr._id || scr.id}>
                      {scr.name} ({scr.screenType || "Standard"})
                    </option>
                  ))}
                </select>
                {showtimeForm.theatreId && (!screensMap[showtimeForm.theatreId] || screensMap[showtimeForm.theatreId].length === 0) && (
                  <small style={{ color: "var(--accent)" }}>
                    Loading screens or no screens available for this theatre.
                  </small>
                )}
              </div>

              <div className="admin-form-group">
                <label>Show Date & Start Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={showtimeForm.startTime}
                  onChange={(e) => setShowtimeForm({ ...showtimeForm, startTime: e.target.value })}
                />
              </div>

              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff", marginTop: "0.5rem" }}>
                Seat Tier Pricing (₹)
              </label>
              <div className="admin-form-row admin-form-row--3">
                <div className="admin-form-group">
                  <label>Silver</label>
                  <input
                    type="number"
                    value={showtimeForm.silverPrice}
                    onChange={(e) => setShowtimeForm({ ...showtimeForm, silverPrice: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Gold</label>
                  <input
                    type="number"
                    value={showtimeForm.goldPrice}
                    onChange={(e) => setShowtimeForm({ ...showtimeForm, goldPrice: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Premium</label>
                  <input
                    type="number"
                    value={showtimeForm.premiumPrice}
                    onChange={(e) => setShowtimeForm({ ...showtimeForm, premiumPrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowShowtimeModal(false)}
                  className="admin-btn admin-btn--ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="admin-btn admin-btn--primary"
                >
                  {actionLoading ? "Scheduling..." : "Schedule Showtime"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD SCREEN TO THEATRE ── */}
      {showScreenModal && selectedTheatreForScreen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <div>
                <h2>Add Screen to {selectedTheatreForScreen.name}</h2>
                <p>Register an additional audi or screen.</p>
              </div>
              <button
                onClick={() => setShowScreenModal(false)}
                className="admin-modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddScreen} className="admin-form">
              <div className="admin-form-group">
                <label>Screen Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audi 3 - IMAX Laser"
                  value={screenForm.name}
                  onChange={(e) => setScreenForm({ ...screenForm, name: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Screen Experience Type</label>
                <select
                  value={screenForm.screenType}
                  onChange={(e) => setScreenForm({ ...screenForm, screenType: e.target.value })}
                >
                  <option value="Standard">Standard</option>
                  <option value="IMAX">IMAX</option>
                  <option value="Dolby Atmos">Dolby Atmos</option>
                  <option value="4DX">4DX</option>
                  <option value="Gold Class">Gold Class</option>
                  <option value="Laser 4K">Laser 4K</option>
                </select>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowScreenModal(false)}
                  className="admin-btn admin-btn--ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="admin-btn admin-btn--primary"
                >
                  {actionLoading ? "Adding..." : "Add Screen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
