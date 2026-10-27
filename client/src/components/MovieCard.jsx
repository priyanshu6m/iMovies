import { Link } from "react-router-dom";
import { Star, Clock, Globe, Ticket } from "lucide-react";
import "./MovieCard.css";

export default function MovieCard({ movie, size = "md" }) {
  const movieId = movie._id || movie.id;
  const { title, genre = [], language, rating, duration, poster, status, certificate } = movie;

  return (
    <Link
      to={`/movie/${movieId}`}
      className={`movie-card movie-card--${size}`}
      id={`movie-card-${movieId}`}
    >
      {/* Poster */}
      <div className="movie-card__poster-wrap">
        <img
          src={poster}
          alt={title}
          className="movie-card__poster"
          loading="lazy"
          onError={(e) => {
            e.target.src = `https://placehold.co/400x600/1a1a1a/555555?text=${encodeURIComponent(title)}`;
          }}
        />
        {/* Overlay */}
        <div className="movie-card__overlay">
          <span className="movie-card__play">▶</span>
        </div>

        {/* Badges */}
        <div className="movie-card__badges">
          <span className={`movie-card__status movie-card__status--${status === "now_showing" ? "now" : "upcoming"}`}>
            {status === "now_showing" ? "Now Showing" : "Upcoming"}
          </span>
          {certificate && (
            <span className="movie-card__cert">{certificate}</span>
          )}
        </div>

        {/* Rating chip */}
        <div className="movie-card__rating-badge">
          <Star size={11} fill="currentColor" />
          {rating}
        </div>
      </div>

      {/* Info */}
      <div className="movie-card__info">
        <h3 className="movie-card__title">{title}</h3>

        <div className="movie-card__meta">
          <span className="movie-card__meta-item">
            <Globe size={12} />
            {language}
          </span>
          <span className="movie-card__dot">·</span>
          <span className="movie-card__meta-item">
            <Clock size={12} />
            {duration}
          </span>
        </div>

        <div className="movie-card__genres">
          {genre.slice(0, 2).map((g) => (
            <span key={g} className="movie-card__genre-tag">
              {g}
            </span>
          ))}
        </div>

        <button className="movie-card__book-btn" id={`book-btn-${movieId}`}>
          <Ticket size={14} />
          Book Tickets
        </button>
      </div>
    </Link>
  );
}
