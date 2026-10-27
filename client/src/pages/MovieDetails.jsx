import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star,
  Clock,
  Globe,
  Calendar,
  Users,
  Award,
  Ticket,
  ChevronRight,
  X,
  MapPin,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  CreditCard,
  Timer,
} from "lucide-react";
import { movieAPI, showtimeAPI, bookingAPI } from "../services/api";
import { useApp } from "../context/AppContext";
import MovieCard from "../components/MovieCard";
import "./MovieDetails.css";

const DEFAULT_SEAT_LAYOUT = {
  premium: ["A", "B", "C"],
  gold: ["D", "E", "F", "G"],
  silver: ["H", "I", "J", "K", "L"],
};

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, addBooking } = useApp();

  const [movie, setMovie]   = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  // Booking overlay state
  const [bookingStep, setBookingStep] = useState(0); // 0=none,1=theatre,2=seats,3=confirm,4=success
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [showtimes, setShowtimes]       = useState([]);
  const [loadingShows, setLoadingShows] = useState(false);
  const [showsError, setShowsError]     = useState(null);

  const [selectedTheatreId, setSelectedTheatreId]     = useState(null);
  const [selectedShowtimeObj, setSelectedShowtimeObj] = useState(null);

  // Real seat availability from backend
  const [availability, setAvailability] = useState(null);
  const [availPricing, setAvailPricing] = useState(null);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [availError, setAvailError]     = useState(null);

  // Seats selected by the user in the UI
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);

  // Booking & payment state
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError]     = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Payment checkout processing
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // ── Movie details ─────────────────────────────────────────────────────────
  const fetchMovieDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await movieAPI.getMovieById(id);
      if (data && data.movie) {
        setMovie(data.movie);
        const primaryGenre = Array.isArray(data.movie.genre) && data.movie.genre[0];
        if (primaryGenre) {
          try {
            const relData = await movieAPI.getMovies({ genre: primaryGenre, limit: 5 });
            if (relData && relData.movies) {
              const currentId = data.movie._id || data.movie.id;
              setRelated(relData.movies.filter((m) => (m._id || m.id) !== currentId).slice(0, 4));
            }
          } catch { /* non-fatal */ }
        }
      } else {
        setError("Movie not found");
      }
    } catch (err) {
      setError(err.message || "Failed to load movie details from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovieDetails();
    window.scrollTo(0, 0);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Showtimes ─────────────────────────────────────────────────────────────
  const fetchShowtimes = async () => {
    if (!id) return;
    try {
      setLoadingShows(true);
      setShowsError(null);
      const data = await showtimeAPI.getShowtimes({ movieId: id, date: selectedDate });
      setShowtimes((data && data.showtimes) ? data.showtimes : []);
    } catch (err) {
      setShowsError(err.message || "Failed to load available showtimes.");
    } finally {
      setLoadingShows(false);
    }
  };

  useEffect(() => {
    if (bookingStep > 0 && id) fetchShowtimes();
  }, [bookingStep, id, selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Seat availability from backend ────────────────────────────────────────
  const fetchSeatAvailability = async (showtimeId) => {
    try {
      setLoadingAvail(true);
      setAvailError(null);
      setAvailability(null);
      setAvailPricing(null);
      setSelectedSeatIds([]);
      const data = await bookingAPI.getSeatAvailability(showtimeId);
      setAvailability(data.availability);
      setAvailPricing(data.pricing);
    } catch (err) {
      setAvailError(err.message || "Failed to load seat availability.");
    } finally {
      setLoadingAvail(false);
    }
  };

  // ── Group showtimes by theatre ────────────────────────────────────────────
  const theatreMap = new Map();
  showtimes.forEach((st) => {
    if (!st.theatre) return;
    const tId = st.theatre._id || st.theatre.id;
    if (!theatreMap.has(tId)) theatreMap.set(tId, { theatre: st.theatre, shows: [] });
    theatreMap.get(tId).shows.push(st);
  });
  const groupedTheatres = Array.from(theatreMap.values());

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="movie-details" style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <div className="auth-spinner" style={{ width: 44, height: 44, borderWidth: 3 }} />
        <p style={{ color: "rgba(255,255,255,0.7)" }}>Loading movie details...</p>
      </div>
    );
  }
  if (error || !movie) {
    return (
      <div className="movie-not-found">
        <AlertCircle size={48} color="#e50914" />
        <h2>{error || "Movie Not Found"}</h2>
        <p style={{ color: "rgba(255,255,255,0.5)", maxWidth: 400, textAlign: "center" }}>
          We couldn't retrieve the requested movie details. It may not exist or the link might be invalid.
        </p>
        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
          <button onClick={fetchMovieDetails} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <RefreshCw size={14} /> Retry
          </button>
          <button onClick={() => navigate("/movies")}>Back to Movies</button>
        </div>
      </div>
    );
  }

  // ── Seat helpers ──────────────────────────────────────────────────────────
  const getSeatCategory = (row) => {
    const layout = selectedShowtimeObj?.screen?.seatLayout || DEFAULT_SEAT_LAYOUT;
    if (layout.premium && layout.premium.includes(row)) return "premium";
    if (layout.gold    && layout.gold.includes(row))    return "gold";
    return "silver";
  };

  const getSeatPrice = (category) => {
    if (availPricing && availPricing[category] !== undefined) return availPricing[category];
    const base = movie.price || 250;
    if (category === "premium") return base + 120;
    if (category === "gold")    return base + 40;
    return base;
  };

  const totalPrice = selectedSeatIds.reduce((acc, seatId) => {
    const row = seatId.charAt(0);
    const category = getSeatCategory(row);
    return acc + getSeatPrice(category);
  }, 0);

  const toggleSeat = (seatId, status) => {
    if (status === "booked") return;
    setSelectedSeatIds((prev) =>
      prev.includes(seatId) ? prev.filter((s) => s !== seatId) : [...prev, seatId]
    );
  };

  // ── Booking & Razorpay Payment flow ───────────────────────────────────────
  const handleStartBooking = () => {
    if (!user) {
      navigate("/login", { state: { from: { pathname: `/movie/${movie._id || movie.id}` } } });
      return;
    }
    setBookingStep(1);
    fetchShowtimes();
  };

  const handleSelectShowtime = (theatreId, showtime) => {
    setSelectedTheatreId(theatreId);
    setSelectedShowtimeObj(showtime);
  };

  const handleProceedToSeats = () => {
    if (!selectedShowtimeObj) return;
    setBookingStep(2);
    fetchSeatAvailability(selectedShowtimeObj._id || selectedShowtimeObj.id);
  };

  /**
   * Dynamically loads the Razorpay checkout script.
   * Returns a promise that resolves to true on success, rejects on failure.
   */
  const loadRazorpayScript = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load payment gateway. Please check your internet connection.'));
      document.body.appendChild(script);
    });

  /**
   * Reserves seats on hold and initiates server-backed payment flow.
   * Never submits a mock/fake signature to the verify endpoint.
   */
  const handleConfirmAndPay = async () => {
    if (!selectedShowtimeObj || selectedSeatIds.length === 0) return;
    setBookingLoading(true);
    setBookingError(null);
    try {
      // Step A: Create booking & hold seats (10-minute hold)
      const data = await bookingAPI.createBooking(
        selectedShowtimeObj._id || selectedShowtimeObj.id,
        selectedSeatIds
      );

      if (!data || !data.booking) {
        throw new Error(data.message || "Failed to create seat reservation.");
      }

      const createdBooking = data.booking;

      // Step B: Load Razorpay SDK before requesting the order
      // (fails explicitly if the script cannot be loaded — no silent mock fallback)
      await loadRazorpayScript();

      // Step C: Request payment order from backend
      const orderData = await bookingAPI.createPaymentOrder(createdBooking._id || createdBooking.id);

      if (!orderData || !orderData.orderId) {
        throw new Error(orderData?.message || "Payment service unavailable. Please try again later.");
      }

      // Step D: Open Razorpay checkout modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "iMovies Cinema",
        description: `Tickets: ${movie.title} (${selectedSeatIds.join(", ")})`,
        image: movie.poster,
        order_id: orderData.orderId,
        prefill: {
          name: user.name || "",
          email: user.email || "",
        },
        theme: {
          color: "#e50914",
        },
        handler: async function (response) {
          // Payment completed — verify HMAC signature on the server
          setIsProcessingPayment(true);
          try {
            const verifyRes = await bookingAPI.verifyPayment(createdBooking._id || createdBooking.id, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes && verifyRes.booking) {
              setConfirmedBooking(verifyRes.booking);
              addBooking(verifyRes.booking);
              setBookingStep(4);
            }
          } catch (verifyErr) {
            setBookingError(verifyErr.message || "Payment verification failed on server.");
          } finally {
            setIsProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: function () {
            // User dismissed the payment modal without completing payment.
            // The seat hold remains active until its expiry (10 min).
            // Navigate to My Bookings so the user can see the pending booking and retry.
            // Do NOT call addBooking() with an unpaid booking as if it were confirmed.
            setBookingStep(0);
            navigate("/my-bookings");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (resp) {
        setBookingError(`Payment failed: ${resp.error?.description || "Transaction declined"}`);
      });
      rzp.open();
    } catch (err) {
      setBookingError(err.message || "Failed to reserve seats. Please try again.");
      if (selectedShowtimeObj) {
        fetchSeatAvailability(selectedShowtimeObj._id || selectedShowtimeObj.id);
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const resetBooking = () => {
    setBookingStep(0);
    setSelectedTheatreId(null);
    setSelectedShowtimeObj(null);
    setSelectedSeatIds([]);
    setAvailability(null);
    setAvailPricing(null);
    setAvailError(null);
    setBookingError(null);
    setConfirmedBooking(null);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const DATES = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  const formatShowTime = (startTimeStr) =>
    new Date(startTimeStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="movie-details">

      {/* ── Booking overlay (steps 1–3) ─────────────────────────────────── */}
      {bookingStep > 0 && bookingStep < 4 && (
        <div className="booking-overlay" id="booking-overlay">
          <div className="booking-panel">
            <div className="booking-panel__header">
              <h3>
                {bookingStep === 1 && "Select Theatre & Showtime"}
                {bookingStep === 2 && "Select Seats"}
                {bookingStep === 3 && "Payment & Confirmation"}
              </h3>
              <button className="booking-panel__close" onClick={resetBooking} id="close-booking" aria-label="Close modal">
                <X size={20} />
              </button>
            </div>

            {/* ── Step 1: Theatre & Showtime ──────────────────────────── */}
            {bookingStep === 1 && (
              <div className="booking-step" id="booking-step-1">
                <div className="booking-section">
                  <h4>Select Date</h4>
                  <div className="booking-dates">
                    {DATES.map((d) => (
                      <button
                        key={d}
                        className={`booking-date${d === selectedDate ? " booking-date--active" : ""}`}
                        onClick={() => { setSelectedDate(d); setSelectedShowtimeObj(null); }}
                        id={`date-btn-${d}`}
                      >
                        {formatDate(d)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="booking-section">
                  <h4>Available Theatres &amp; Schedules</h4>

                  {loadingShows ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2.5rem 1rem", gap: "0.8rem", color: "rgba(255,255,255,0.6)" }}>
                      <div className="auth-spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
                      <p style={{ fontSize: "0.88rem" }}>Fetching real-time showtimes...</p>
                    </div>
                  ) : showsError ? (
                    <div style={{ padding: "1.5rem", textAlign: "center", background: "rgba(229,9,20,0.06)", borderRadius: 10, border: "1px solid rgba(229,9,20,0.2)" }}>
                      <AlertCircle size={28} color="#e50914" style={{ marginBottom: 6 }} />
                      <p style={{ color: "#fff", margin: "0 0 0.5rem" }}>{showsError}</p>
                      <button onClick={fetchShowtimes} style={{ background: "#e50914", color: "#fff", border: "none", padding: "0.4rem 1rem", borderRadius: 6, cursor: "pointer", fontSize: "0.85rem" }}>Retry</button>
                    </div>
                  ) : groupedTheatres.length === 0 ? (
                    <div style={{ padding: "2.5rem 1.5rem", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                      <Calendar size={36} color="rgba(255,255,255,0.4)" style={{ marginBottom: 8 }} />
                      <h4 style={{ color: "#fff", margin: "0 0 0.3rem" }}>No showtimes on {formatDate(selectedDate)}</h4>
                      <p style={{ color: "rgba(255,255,255,0.5)", margin: 0, fontSize: "0.85rem" }}>
                        Please select another date from the strip above.
                      </p>
                    </div>
                  ) : (
                    groupedTheatres.map(({ theatre, shows }) => {
                      const tId = theatre._id || theatre.id;
                      const isTheatreSelected = selectedTheatreId === tId;
                      return (
                        <div
                          key={tId}
                          className={`booking-theatre${isTheatreSelected ? " booking-theatre--active" : ""}`}
                          id={`theatre-${tId}`}
                          style={{ cursor: "default", marginBottom: "1rem" }}
                        >
                          <div className="booking-theatre__info">
                            <strong>{theatre.name}</strong>
                            <span><MapPin size={12} /> {theatre.location || `${theatre.address}, ${theatre.city}`}</span>
                            <div className="booking-theatre__amenities">
                              {(theatre.amenities || []).slice(0, 3).map((a) => (
                                <span key={a} className="booking-amenity">{a}</span>
                              ))}
                            </div>
                          </div>
                          {theatre.rating && (
                            <div className="booking-theatre__rating">
                              <Star size={13} fill="#FFD700" color="#FFD700" /> {theatre.rating}
                            </div>
                          )}
                          <div style={{ width: "100%", marginTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "0.75rem" }}>
                            <div className="booking-showtimes">
                              {shows.map((s) => {
                                const sId = s._id || s.id;
                                const isShowSelected = (selectedShowtimeObj?._id || selectedShowtimeObj?.id) === sId;
                                const isAvailable = s.status === "scheduled" && s.isActive;
                                return (
                                  <button
                                    key={sId}
                                    type="button"
                                    className={`booking-showtime${isShowSelected ? " booking-showtime--active" : ""}${!isAvailable ? " booking-showtime--full" : ""}`}
                                    onClick={() => isAvailable && handleSelectShowtime(tId, s)}
                                    disabled={!isAvailable}
                                    id={`showtime-${sId}`}
                                    title={`Screen: ${s.screen?.name || "Screen"} (${s.screen?.screenType || "Standard"})`}
                                  >
                                    <span className="booking-showtime__time">{s.formattedTime || formatShowTime(s.startTime)}</span>
                                    <span className="booking-showtime__type">{s.screen?.screenType || s.screen?.name || "Standard"}</span>
                                    {s.pricing && (
                                      <span style={{ fontSize: "0.68rem", opacity: 0.8, color: isShowSelected ? "#fff" : "rgba(255,255,255,0.6)" }}>
                                        ₹{s.pricing.silver || movie.price || 250}+
                                      </span>
                                    )}
                                    {!isAvailable && <span className="booking-showtime__full">FULL</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {selectedShowtimeObj && (
                  <div style={{ background: "rgba(229,9,20,0.1)", border: "1px solid rgba(229,9,20,0.25)", borderRadius: 10, padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.92rem" }}>{selectedShowtimeObj.theatre?.name}</div>
                      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem" }}>
                        {selectedShowtimeObj.screen?.name} · {selectedShowtimeObj.formattedTime || formatShowTime(selectedShowtimeObj.startTime)} · Silver: ₹{selectedShowtimeObj.pricing?.silver} | Gold: ₹{selectedShowtimeObj.pricing?.gold} | Premium: ₹{selectedShowtimeObj.pricing?.premium}
                      </div>
                    </div>
                  </div>
                )}

                <button className="booking-next-btn" disabled={!selectedShowtimeObj} onClick={handleProceedToSeats} id="booking-next-1">
                  Continue to Seat Selection <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* ── Step 2: Seat Selection ────────────────────────────────── */}
            {bookingStep === 2 && (
              <div className="booking-step" id="booking-step-2">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "0.6rem 0.9rem", borderRadius: 8, fontSize: "0.82rem", color: "rgba(255,255,255,0.7)" }}>
                  <span><strong>{selectedShowtimeObj?.theatre?.name}</strong> ({selectedShowtimeObj?.screen?.name})</span>
                  <span>{formatDate(selectedDate)} · {selectedShowtimeObj?.formattedTime || formatShowTime(selectedShowtimeObj?.startTime)}</span>
                </div>

                {loadingAvail ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.8rem", padding: "3rem 0", color: "rgba(255,255,255,0.6)" }}>
                    <Loader2 size={36} style={{ animation: "spin 1s linear infinite" }} />
                    <p>Loading real seat availability...</p>
                  </div>
                ) : availError ? (
                  <div style={{ padding: "1.5rem", textAlign: "center", background: "rgba(229,9,20,0.06)", borderRadius: 10, border: "1px solid rgba(229,9,20,0.2)" }}>
                    <AlertCircle size={28} color="#e50914" style={{ marginBottom: 6 }} />
                    <p style={{ color: "#fff", margin: "0 0 0.5rem" }}>{availError}</p>
                    <button onClick={() => fetchSeatAvailability(selectedShowtimeObj._id || selectedShowtimeObj.id)} style={{ background: "#e50914", color: "#fff", border: "none", padding: "0.4rem 1rem", borderRadius: 6, cursor: "pointer", fontSize: "0.85rem" }}>Retry</button>
                  </div>
                ) : availability ? (
                  <>
                    <div className="seat-legend" style={{ marginTop: "0.5rem" }}>
                      <span><span className="seat-dot seat-dot--available" /> Available</span>
                      <span><span className="seat-dot seat-dot--selected" /> Selected</span>
                      <span><span className="seat-dot seat-dot--booked" /> Booked / Held</span>
                    </div>
                    <div className="seat-screen">🎬 SCREEN ({selectedShowtimeObj?.screen?.screenType || "Standard"})</div>

                    {["premium", "gold", "silver"].map((cat) => {
                      const catSeats = availability[cat] || [];
                      if (catSeats.length === 0) return null;

                      // Group by row
                      const rowsMap = {};
                      catSeats.forEach((s) => {
                        if (!rowsMap[s.row]) rowsMap[s.row] = [];
                        rowsMap[s.row].push(s);
                      });

                      return Object.entries(rowsMap).map(([row, rowSeats]) => (
                        <div key={row} className={`seat-row seat-row--${cat}`}>
                          <span className="seat-row-label">{row}</span>
                          {rowSeats.map((seat) => {
                            const isSelected = selectedSeatIds.includes(seat.seatId);
                            const isBooked   = seat.status === "booked";
                            return (
                              <button
                                key={seat.seatId}
                                className={`seat${isBooked ? " seat--booked" : ""}${isSelected ? " seat--selected" : ""}`}
                                onClick={() => toggleSeat(seat.seatId, seat.status)}
                                disabled={isBooked}
                                title={`${seat.seatId} - ₹${getSeatPrice(cat)}`}
                                id={`seat-${seat.seatId}`}
                              >
                                {seat.number}
                              </button>
                            );
                          })}
                          <span className="seat-type-label">
                            {cat.charAt(0).toUpperCase() + cat.slice(1)} (₹{getSeatPrice(cat)})
                          </span>
                        </div>
                      ));
                    })}

                    <div className="seat-summary">
                      <span>{selectedSeatIds.length} seat{selectedSeatIds.length !== 1 ? "s" : ""} selected</span>
                      <span className="seat-summary__price">₹{totalPrice.toLocaleString()}</span>
                    </div>
                  </>
                ) : null}

                <div className="booking-actions">
                  <button className="booking-back-btn" onClick={() => setBookingStep(1)} id="booking-back-2">Back</button>
                  <button
                    className="booking-next-btn"
                    disabled={selectedSeatIds.length === 0 || loadingAvail}
                    onClick={() => setBookingStep(3)}
                    id="booking-next-2"
                  >
                    Proceed to Confirm <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Confirmation & Payment ────────────────────────── */}
            {bookingStep === 3 && (
              <div className="booking-step" id="booking-step-3">
                <div className="booking-confirm">
                  <img src={movie.poster} alt={movie.title} className="booking-confirm__poster" />
                  <div className="booking-confirm__info">
                    <h3>{movie.title}</h3>
                    <p><MapPin size={13} /> {selectedShowtimeObj?.theatre?.name} ({selectedShowtimeObj?.screen?.name})</p>
                    <p><Calendar size={13} /> {formatDate(selectedDate)} · {selectedShowtimeObj?.formattedTime || formatShowTime(selectedShowtimeObj?.startTime)}</p>
                    <p><Ticket size={13} /> Seats: {selectedSeatIds.join(", ")}</p>
                    <div className="booking-confirm__price">
                      <span>Total Amount</span>
                      <strong>₹{totalPrice.toLocaleString()}</strong>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#38bdf8", fontSize: "0.82rem", marginTop: "0.4rem" }}>
                      <Timer size={14} />
                      <span>Seats will be reserved for <strong>10 minutes</strong> upon checkout.</span>
                    </div>

                    {bookingError && (
                      <div style={{ background: "rgba(229,9,20,0.1)", border: "1px solid rgba(229,9,20,0.3)", borderRadius: 8, padding: "0.6rem 0.9rem", marginTop: "0.75rem" }}>
                        <AlertCircle size={14} color="#e50914" style={{ verticalAlign: "middle", marginRight: 6 }} />
                        <span style={{ color: "#ff6b6b", fontSize: "0.83rem" }}>{bookingError}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="booking-actions">
                  <button className="booking-back-btn" onClick={() => { setBookingError(null); setBookingStep(2); }} id="booking-back-3">Back</button>
                  <button
                    className="booking-confirm-btn"
                    onClick={handleConfirmAndPay}
                    disabled={bookingLoading || isProcessingPayment}
                    id="confirm-booking-btn"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
                  >
                    {bookingLoading || isProcessingPayment ? (
                      <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Processing Payment...</>
                    ) : (
                      <><CreditCard size={16} /> Pay ₹{totalPrice.toLocaleString()}</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Booking Success ─────────────────────────────────────────────── */}
      {bookingStep === 4 && confirmedBooking && (
        <div className="booking-overlay" id="booking-success-overlay">
          <div className="booking-success">
            <CheckCircle size={64} className="booking-success__icon" />
            <h2>{confirmedBooking.paymentStatus === "paid" ? "Booking Confirmed! 🎉" : "Seats Held — Payment Pending"}</h2>
            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "0.9rem 1.2rem", margin: "0.75rem 0", textAlign: "left", fontSize: "0.88rem", color: "rgba(255,255,255,0.85)" }}>
              <div><strong>Booking Ref:</strong> {confirmedBooking.bookingRef}</div>
              <div style={{ marginTop: 4 }}><strong>Seats:</strong> {confirmedBooking.seats?.map((s) => s.seatId).join(", ")}</div>
              <div style={{ marginTop: 4 }}><strong>Total:</strong> ₹{confirmedBooking.totalAmount?.toLocaleString()}</div>
              <div style={{ marginTop: 4 }}>
                <strong>Payment Status:</strong>{" "}
                <span style={{
                  color: confirmedBooking.paymentStatus === "paid" ? "#00c853" : "#ffb300",
                  fontWeight: 600,
                  textTransform: "capitalize",
                }}>
                  {confirmedBooking.paymentStatus}
                </span>
                {confirmedBooking.paymentStatus !== "paid" && (
                  <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
                    (Holds expire if payment is not completed within 10 minutes)
                  </div>
                )}
              </div>
            </div>
            <div className="booking-success-actions">
              <button onClick={() => navigate("/my-bookings")} className="booking-next-btn" id="view-bookings-btn">
                View My Bookings
              </button>
              <button onClick={resetBooking} className="booking-back-btn" id="book-another-btn">
                Book Another
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Backdrop ──────────────────────────────────────────────────────── */}
      <div className="movie-details__backdrop" style={{ backgroundImage: `url(${movie.backdrop || movie.poster})` }}>
        <div className="movie-details__backdrop-overlay" />
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="movie-details__inner">
        <div className="movie-details__top">
          <div className="movie-details__poster-wrap">
            <img src={movie.poster} alt={movie.title} className="movie-details__poster" />
          </div>

          <div className="movie-details__info">
            <div className="movie-details__badges">
              {movie.certificate && <span className="movie-details__cert">{movie.certificate}</span>}
              <span className={`movie-details__status-badge movie-details__status-badge--${movie.status === "now_showing" ? "now" : "upcoming"}`}>
                {movie.status === "now_showing" ? "Now Showing" : "Upcoming"}
              </span>
            </div>

            <h1 className="movie-details__title">{movie.title}</h1>

            <div className="movie-details__meta-row">
              <span className="movie-details__rating">
                <Star size={18} fill="#FFD700" color="#FFD700" />
                <strong>{movie.rating}</strong>
                {movie.votes && <span>({movie.votes} votes)</span>}
              </span>
              <span className="movie-details__sep">·</span>
              <span className="movie-details__dur"><Clock size={15} /> {movie.duration}</span>
              <span className="movie-details__sep">·</span>
              <span className="movie-details__lang"><Globe size={15} /> {movie.language}</span>
            </div>

            {Array.isArray(movie.genre) && movie.genre.length > 0 && (
              <div className="movie-details__genres">
                {movie.genre.map((g) => <span key={g} className="movie-details__genre">{g}</span>)}
              </div>
            )}

            <p className="movie-details__description">{movie.description}</p>

            <div className="movie-details__crew">
              {movie.director && (
                <div className="movie-details__crew-item">
                  <span className="movie-details__crew-label"><Award size={14} /> Director</span>
                  <span className="movie-details__crew-value">{movie.director}</span>
                </div>
              )}
              {Array.isArray(movie.cast) && movie.cast.length > 0 && (
                <div className="movie-details__crew-item">
                  <span className="movie-details__crew-label"><Users size={14} /> Cast</span>
                  <span className="movie-details__crew-value">{movie.cast.join(", ")}</span>
                </div>
              )}
              {movie.releaseDate && (
                <div className="movie-details__crew-item">
                  <span className="movie-details__crew-label"><Calendar size={14} /> Release</span>
                  <span className="movie-details__crew-value">
                    {new Date(movie.releaseDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
              )}
            </div>

            <div className="movie-details__price-row">
              <span className="movie-details__price-label">Starting from</span>
              <span className="movie-details__price">₹{movie.price || 250}</span>
            </div>

            {movie.status === "now_showing" ? (
              <button className="movie-details__book-btn" onClick={handleStartBooking} id="start-booking-btn">
                <Ticket size={18} /> Book Tickets
              </button>
            ) : (
              <button className="movie-details__book-btn movie-details__book-btn--upcoming" disabled>
                <Calendar size={18} />
                Coming {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Soon"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Related movies ────────────────────────────────────────────────── */}
      {related.length > 0 && (
        <div className="movie-details__related">
          <div className="movie-details__related-inner">
            <h2 className="movie-details__related-title">You May Also Like</h2>
            <div className="movie-details__related-grid">
              {related.map((m) => <MovieCard key={m._id || m.id} movie={m} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
