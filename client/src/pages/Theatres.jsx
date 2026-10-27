import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Building2, Star, MapPin, Wifi, Coffee, Volume2, Film, Sofa, AlertCircle, RefreshCw } from "lucide-react";
import { theatreAPI } from "../services/api";
import "./Theatres.css";

const ICON_MAP = {
  IMAX: <Film size={14} />,
  "4DX": <Volume2 size={14} />,
  "Dolby Atmos": <Volume2 size={14} />,
  "4K Laser": <Film size={14} />,
  "Recliner Seats": <Sofa size={14} />,
  "VIP Lounge": <Coffee size={14} />,
  "Fine Dining": <Coffee size={14} />,
  "RealD 3D": <Film size={14} />,
  "4K Projection": <Film size={14} />,
  "Atmos Sound": <Volume2 size={14} />,
  "Premium Seating": <Sofa size={14} />,
  "3D": <Film size={14} />,
  "Lounge Access": <Coffee size={14} />,
};

export default function Theatres() {
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTheatres = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await theatreAPI.getTheatres();
      if (data && data.theatres) {
        setTheatres(data.theatres);
      }
    } catch (err) {
      console.error("Failed to load theatres:", err);
      setError(err.message || "Failed to load theatres from the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheatres();
  }, []);

  return (
    <div className="theatres-page">
      <div className="theatres-page__header">
        <div className="theatres-page__header-inner">
          <h1>Our Theatres</h1>
          <p>Premium cinema experiences across India's top cities</p>
        </div>
      </div>

      <div className="theatres-page__body">
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 2rem", gap: "1rem", color: "rgba(255,255,255,0.6)" }}>
            <div className="auth-spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
            <p>Loading premium theatres...</p>
          </div>
        ) : error ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 2rem", gap: "1rem", textAlign: "center" }}>
            <AlertCircle size={44} color="#e50914" />
            <h3 style={{ color: "#fff", margin: 0 }}>Error Loading Theatres</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", maxWidth: 450, margin: 0 }}>{error}</p>
            <button
              onClick={fetchTheatres}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "#e50914",
                color: "#fff",
                border: "none",
                padding: "0.5rem 1.2rem",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : theatres.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", color: "rgba(255,255,255,0.6)" }}>
            <h3>No theatres currently available</h3>
          </div>
        ) : (
          <div className="theatres-page__grid">
            {theatres.map((theatre) => {
              const theatreId = theatre._id || theatre.id;
              return (
                <div key={theatreId} className="theatre-card" id={`theatre-card-${theatreId}`}>
                  <div className="theatre-card__top">
                    <div className="theatre-card__icon">
                      <Building2 size={28} />
                    </div>
                    <div className="theatre-card__rating">
                      <Star size={14} fill="#FFD700" color="#FFD700" />
                      {theatre.rating}
                    </div>
                  </div>

                  <h3 className="theatre-card__name">{theatre.name}</h3>
                  <p className="theatre-card__location">
                    <MapPin size={14} /> {theatre.location || `${theatre.address}, ${theatre.city}`}
                  </p>

                  <div className="theatre-card__amenities">
                    {(theatre.amenities || []).map((a) => (
                      <span key={a} className="theatre-card__amenity">
                        {ICON_MAP[a] || <Wifi size={14} />} {a}
                      </span>
                    ))}
                  </div>

                  <Link to="/movies" className="theatre-card__btn" id={`theatre-book-${theatreId}`} style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
                    View Shows
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* Info banner */}
        <div className="theatres-page__banner">
          <div className="theatres-page__banner-content">
            <h2>More Theatres Coming Soon</h2>
            <p>
              We&apos;re expanding to 100+ cities across India. Stay tuned for announcements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
