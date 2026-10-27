import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Ticket, Calendar, MapPin, Clock, CheckCircle, XCircle,
  Film, ArrowRight, Loader2, AlertCircle, RefreshCw,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import "./MyBookings.css";

export default function MyBookings() {
  const { user, bookings, bookingsLoading, cancelBooking, fetchBookings } = useApp();
  const navigate = useNavigate();

  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError]   = useState(null);

  // Refresh bookings when the page mounts (user may have booked on another page)
  useEffect(() => {
    if (user) fetchBookings();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return (
      <div className="my-bookings">
        <div className="my-bookings__empty-auth">
          <Film size={60} />
          <h2>Sign In to View Bookings</h2>
          <p>You need to be logged in to see your ticket history.</p>
          <div className="my-bookings__empty-actions">
            <Link to="/login"    className="my-bookings__btn-primary" id="mb-login-btn">Sign In</Link>
            <Link to="/register" className="my-bookings__btn-ghost"   id="mb-register-btn">Create Account</Link>
          </div>
        </div>
      </div>
    );
  }

  const now = new Date();

  const upcoming = bookings.filter((b) => {
    if (b.status === "cancelled") return false;
    const start = b.showtime?.startTime ? new Date(b.showtime.startTime) : null;
    if (start) return start >= now;
    // Fallback for older records without populated showtime
    return true;
  });

  const past = bookings.filter((b) => {
    if (b.status === "cancelled") return false;
    const start = b.showtime?.startTime ? new Date(b.showtime.startTime) : null;
    if (start) return start < now;
    return false;
  });

  const cancelled = bookings.filter((b) => b.status === "cancelled");

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const formatTime = (iso) =>
    iso ? new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : "";

  const handleCancel = async (booking) => {
    if (!window.confirm("Are you sure you want to cancel this booking? This cannot be undone.")) return;
    const bookingId = booking._id || booking.id;
    setCancellingId(bookingId);
    setCancelError(null);
    try {
      await cancelBooking(bookingId, "Cancelled by user");
    } catch (err) {
      setCancelError(err.message || "Failed to cancel booking. Please try again.");
    } finally {
      setCancellingId(null);
    }
  };

  const canCancel = (booking) => {
    if (booking.status === "cancelled") return false;
    const start = booking.showtime?.startTime ? new Date(booking.showtime.startTime) : null;
    return start ? start > now : false;
  };

  const BookingCard = ({ booking, isPast, isCancelled }) => {
    const bookingId = booking._id || booking.id;
    const isCancelling = cancellingId === bookingId;
    const seats = booking.seats?.map((s) => s.seatId).join(", ") || "—";
    const theatre = booking.theatre?.name || "—";
    const screenName = booking.screen?.name || "";
    const movieTitle = booking.movie?.title || "Movie";
    const moviePoster = booking.movie?.poster || `https://placehold.co/80x120/1a1a1a/555?text=${encodeURIComponent(movieTitle)}`;
    const showStart = booking.showtime?.startTime;

    return (
      <div
        className={`booking-card${isPast || isCancelled ? " booking-card--past" : ""}`}
        id={`booking-card-${bookingId}`}
      >
        <div className="booking-card__status-bar" />
        <div className="booking-card__inner">
          <img
            src={moviePoster}
            alt={movieTitle}
            className="booking-card__poster"
            onError={(e) => { e.target.src = `https://placehold.co/80x120/1a1a1a/555?text=Movie`; }}
          />
          <div className="booking-card__info">
            <div className="booking-card__header">
              <h3 className="booking-card__title">{movieTitle}</h3>
              <span className={`booking-card__badge${isCancelled ? " booking-card__badge--past" : isPast ? " booking-card__badge--past" : " booking-card__badge--upcoming"}`}>
                {isCancelled ? <><XCircle size={13} /> Cancelled</> :
                  isPast ? <><XCircle size={13} /> Past</> :
                    <><CheckCircle size={13} /> Confirmed</>}
              </span>
            </div>

            <div className="booking-card__meta">
              {theatre && <span><MapPin size={13} /> {theatre}{screenName ? ` · ${screenName}` : ""}</span>}
              {showStart && <span><Calendar size={13} /> {formatDate(showStart)}</span>}
              {showStart && <span><Clock size={13} /> {formatTime(showStart)}</span>}
              <span><Ticket size={13} /> Seats: {seats}</span>
            </div>

            <div className="booking-card__footer">
              <div>
                <span className="booking-card__ref">Ref: {booking.bookingRef}</span>
                <span className="booking-card__price">₹{booking.totalAmount?.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem" }}>
                {/* Payment badge */}
                <span style={{
                  fontSize: "0.72rem",
                  padding: "0.15rem 0.5rem",
                  borderRadius: 4,
                  background: booking.paymentStatus === "paid" ? "rgba(0,200,83,0.15)" :
                              booking.paymentStatus === "refunded" ? "rgba(100,100,255,0.15)" :
                              "rgba(255,180,0,0.15)",
                  color: booking.paymentStatus === "paid" ? "#00c853" :
                         booking.paymentStatus === "refunded" ? "#9fa8da" :
                         "#ffb300",
                }}>
                  Payment: {booking.paymentStatus || "pending"}
                </span>
                {canCancel(booking) && (
                  <button
                    className="booking-card__cancel-btn"
                    onClick={() => handleCancel(booking)}
                    disabled={isCancelling}
                    id={`cancel-booking-${bookingId}`}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                  >
                    {isCancelling ? <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Cancelling...</> : "Cancel Booking"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ticket perforation */}
        <div className="booking-card__perforation">
          <div className="booking-card__perf-circle booking-card__perf-circle--left" />
          <div className="booking-card__perf-line" />
          <div className="booking-card__perf-circle booking-card__perf-circle--right" />
        </div>
        <div className="booking-card__qr">
          <div className="booking-card__qr-inner">
            {Array.from({ length: 25 }, (_, i) => (
              <div key={i} className="booking-card__qr-cell" style={{ background: (bookingId?.charCodeAt(i % bookingId.length) || i) % 2 === 0 ? "#fff" : "transparent" }} />
            ))}
          </div>
          <span>Scan at gate</span>
        </div>
      </div>
    );
  };

  return (
    <div className="my-bookings">
      <div className="my-bookings__header">
        <div className="my-bookings__header-inner">
          <div>
            <h1>My Bookings</h1>
            <p>
              Welcome back, <strong>{user.name}</strong> ·{" "}
              {bookings.length} booking{bookings.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.7rem", alignItems: "center" }}>
            <button
              onClick={fetchBookings}
              disabled={bookingsLoading}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "0.45rem 0.9rem", borderRadius: 8, cursor: "pointer", fontSize: "0.83rem" }}
            >
              <RefreshCw size={13} /> Refresh
            </button>
            <Link to="/movies" className="my-bookings__btn-primary" id="browse-movies-btn">
              Browse Movies <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      <div className="my-bookings__body">
        {cancelError && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(229,9,20,0.1)", border: "1px solid rgba(229,9,20,0.25)", borderRadius: 8, padding: "0.7rem 1rem", marginBottom: "1rem", color: "#ff6b6b", fontSize: "0.88rem" }}>
            <AlertCircle size={16} color="#e50914" />
            {cancelError}
          </div>
        )}

        {bookingsLoading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "4rem 0", color: "rgba(255,255,255,0.6)" }}>
            <Loader2 size={40} style={{ animation: "spin 1s linear infinite" }} />
            <p>Loading your bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="my-bookings__empty">
            <Ticket size={64} />
            <h2>No Bookings Yet</h2>
            <p>You haven&apos;t booked any tickets. Start exploring movies!</p>
            <Link to="/movies" className="my-bookings__btn-primary" id="empty-browse-btn">Explore Movies</Link>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section className="my-bookings__section" id="upcoming-bookings">
                <h2 className="my-bookings__section-title"><CheckCircle size={18} /> Upcoming ({upcoming.length})</h2>
                <div className="my-bookings__list">
                  {upcoming.map((b) => <BookingCard key={b._id || b.id} booking={b} isPast={false} isCancelled={false} />)}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section className="my-bookings__section" id="past-bookings">
                <h2 className="my-bookings__section-title"><Clock size={18} /> History ({past.length})</h2>
                <div className="my-bookings__list">
                  {past.map((b) => <BookingCard key={b._id || b.id} booking={b} isPast={true} isCancelled={false} />)}
                </div>
              </section>
            )}

            {cancelled.length > 0 && (
              <section className="my-bookings__section" id="cancelled-bookings">
                <h2 className="my-bookings__section-title"><XCircle size={18} /> Cancelled ({cancelled.length})</h2>
                <div className="my-bookings__list">
                  {cancelled.map((b) => <BookingCard key={b._id || b.id} booking={b} isPast={false} isCancelled={true} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
