import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, SlidersHorizontal, X, ChevronDown, AlertCircle, RefreshCw } from "lucide-react";
import { movieAPI } from "../services/api";
import { useApp } from "../context/AppContext";
import MovieCard from "../components/MovieCard";
import "./Movies.css";

const STANDARD_GENRES = [
  "Action",
  "Comedy",
  "Crime",
  "Drama",
  "Horror",
  "Mystery",
  "Mythology",
  "Romance",
  "Sci-Fi",
  "Spy",
  "Thriller",
  "War",
];

const STANDARD_LANGS = ["English", "Hindi", "Tamil", "Telugu"];

const FILTERS = [
  { key: "all", label: "All Movies" },
  { key: "now_showing", label: "Now Showing" },
  { key: "upcoming", label: "Upcoming" },
  { key: "trending", label: "Trending 🔥" },
];

export default function Movies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchQuery, setSearchQuery } = useApp();

  const [query, setQuery] = useState(searchParams.get("search") || searchQuery || "");
  const [filter, setFilter] = useState(searchParams.get("filter") || "all");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedLangs, setSelectedLangs] = useState([]);
  const [sortBy, setSortBy] = useState("rating");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minRating, setMinRating] = useState(0);

  // API Data state
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Sync search query from context/URL
  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch !== null) setQuery(urlSearch);
    const urlFilter = searchParams.get("filter");
    if (urlFilter) setFilter(urlFilter);
  }, [searchParams]);

  // Fetch movies from API
  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        limit: 50,
      };

      if (query.trim()) params.search = query.trim();
      if (filter === "now_showing") params.status = "now_showing";
      else if (filter === "upcoming") params.status = "upcoming";
      else if (filter === "trending") params.trending = "true";

      if (selectedGenres.length > 0) params.genre = selectedGenres.join(",");
      if (selectedLangs.length > 0) params.language = selectedLangs.join(",");
      if (minRating > 0) params.minRating = minRating;

      // Sort parameter mapping
      if (sortBy === "rating") params.sort = "-rating";
      else if (sortBy === "title") params.sort = "title";
      else if (sortBy === "release") params.sort = "-releaseDate";
      else if (sortBy === "price_asc") params.sort = "price_asc";
      else if (sortBy === "price_desc") params.sort = "price_desc";

      const data = await movieAPI.getMovies(params);
      if (data && data.movies) {
        setMovies(data.movies);
        setTotalCount(data.total ?? data.movies.length);
      }
    } catch (err) {
      console.error("Failed to load movies:", err);
      setError(err.message || "Failed to load movies from the database.");
    } finally {
      setLoading(false);
    }
  }, [query, filter, selectedGenres, selectedLangs, minRating, sortBy]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  // Compute available genres and languages dynamically from loaded movies or fallback to standards
  const availableGenres = useMemo(() => {
    const dynamic = [...new Set(movies.flatMap((m) => m.genre || []))];
    const combined = [...new Set([...STANDARD_GENRES, ...dynamic])];
    return combined.sort();
  }, [movies]);

  const availableLangs = useMemo(() => {
    const dynamic = [...new Set(movies.map((m) => m.language).filter(Boolean))];
    const combined = [...new Set([...STANDARD_LANGS, ...dynamic])];
    return combined.sort();
  }, [movies]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(query);
    setSearchParams(query ? { search: query, ...(filter !== "all" ? { filter } : {}) } : (filter !== "all" ? { filter } : {}));
  };

  const handleFilterTab = (fKey) => {
    setFilter(fKey);
    const newParams = {};
    if (query) newParams.search = query;
    if (fKey !== "all") newParams.filter = fKey;
    setSearchParams(newParams);
  };

  const toggleGenre = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const toggleLang = (lang) => {
    setSelectedLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedLangs([]);
    setMinRating(0);
    setFilter("all");
    setQuery("");
    setSearchQuery("");
    setSearchParams({});
  };

  const hasActiveFilters =
    selectedGenres.length > 0 || selectedLangs.length > 0 || minRating > 0 || query !== "" || filter !== "all";

  return (
    <div className="movies-page">
      {/* Page Header */}
      <div className="movies-page__header">
        <div className="movies-page__header-inner">
          <div>
            <h1 className="movies-page__title">Movies</h1>
            <p className="movies-page__subtitle">
              {loading ? "Searching movies..." : `${totalCount} movie${totalCount !== 1 ? "s" : ""} found`}
            </p>
          </div>

          {/* Search */}
          <form className="movies-page__search" onSubmit={handleSearch} id="movies-search-form">
            <Search size={18} className="movies-page__search-icon" />
            <input
              type="text"
              id="movies-search-input"
              placeholder="Search movies, genres, cast…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="movies-page__search-input"
            />
            {query && (
              <button
                type="button"
                className="movies-page__search-clear"
                onClick={() => {
                  setQuery("");
                  setSearchQuery("");
                  const p = {};
                  if (filter !== "all") p.filter = filter;
                  setSearchParams(p);
                }}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
            <button type="submit" className="movies-page__search-btn" id="movies-search-btn">
              Search
            </button>
          </form>
        </div>

        {/* Filter tabs */}
        <div className="movies-page__tabs">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`movies-page__tab${filter === f.key ? " movies-page__tab--active" : ""}`}
              onClick={() => handleFilterTab(f.key)}
              id={`filter-tab-${f.key}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="movies-page__body">
        {/* Sidebar Filters */}
        <aside className={`movies-page__sidebar${filtersOpen ? " movies-page__sidebar--open" : ""}`} id="movies-sidebar">
          <div className="movies-page__sidebar-header">
            <span><Filter size={16} /> Filters</span>
            {hasActiveFilters && (
              <button className="movies-page__clear-btn" onClick={clearFilters} id="clear-filters-btn">
                Clear All
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="filter-group">
            <label className="filter-group__label" htmlFor="sort-select">Sort By</label>
            <div className="filter-select-wrap">
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="rating">Rating (High to Low)</option>
                <option value="title">Title (A-Z)</option>
                <option value="release">Release Date</option>
                <option value="price_asc">Price (Low to High)</option>
                <option value="price_desc">Price (High to Low)</option>
              </select>
              <ChevronDown size={14} className="filter-select-chevron" />
            </div>
          </div>

          {/* Genre */}
          <div className="filter-group">
            <label className="filter-group__label">Genre</label>
            <div className="filter-tags">
              {availableGenres.map((g) => (
                <button
                  key={g}
                  className={`filter-tag${selectedGenres.includes(g) ? " filter-tag--active" : ""}`}
                  onClick={() => toggleGenre(g)}
                  id={`genre-tag-${g.toLowerCase()}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="filter-group">
            <label className="filter-group__label">Language</label>
            <div className="filter-tags">
              {availableLangs.map((l) => (
                <button
                  key={l}
                  className={`filter-tag${selectedLangs.includes(l) ? " filter-tag--active" : ""}`}
                  onClick={() => toggleLang(l)}
                  id={`lang-tag-${l.toLowerCase()}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Min Rating */}
          <div className="filter-group">
            <label className="filter-group__label" htmlFor="rating-range">
              Min Rating: <span className="filter-rating-value">{minRating > 0 ? `${minRating}★` : "Any"}</span>
            </label>
            <input
              type="range"
              id="rating-range"
              min={0}
              max={9}
              step={0.5}
              value={minRating}
              onChange={(e) => setMinRating(parseFloat(e.target.value))}
              className="filter-range"
            />
            <div className="filter-range-labels">
              <span>Any</span>
              <span>9.0+</span>
            </div>
          </div>
        </aside>

        {/* Mobile filter toggle */}
        <button
          className="movies-page__filter-toggle"
          onClick={() => setFiltersOpen((v) => !v)}
          id="mobile-filter-toggle"
        >
          <SlidersHorizontal size={16} />
          {filtersOpen ? "Hide Filters" : "Show Filters"}
          {hasActiveFilters && (
            <span className="movies-page__filter-badge">
              {selectedGenres.length + selectedLangs.length + (minRating > 0 ? 1 : 0)}
            </span>
          )}
        </button>

        {/* Grid */}
        <main className="movies-page__main">
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 2rem", gap: "1rem", color: "rgba(255,255,255,0.6)" }}>
              <div className="auth-spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
              <p>Fetching movies from database...</p>
            </div>
          ) : error ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 2rem", gap: "1rem", textAlign: "center" }}>
              <AlertCircle size={44} color="#e50914" />
              <h3 style={{ color: "#fff", margin: 0 }}>Error Loading Movies</h3>
              <p style={{ color: "rgba(255,255,255,0.6)", maxWidth: 450, margin: 0 }}>{error}</p>
              <button
                className="movies-page__empty-btn"
                onClick={fetchMovies}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          ) : movies.length === 0 ? (
            <div className="movies-page__empty">
              <Search size={48} />
              <h3>No movies found</h3>
              <p>Try adjusting your search or filters.</p>
              <button className="movies-page__empty-btn" onClick={clearFilters}>Clear All Filters</button>
            </div>
          ) : (
            <div className="movies-page__grid">
              {movies.map((m) => (
                <MovieCard key={m._id || m.id} movie={m} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
