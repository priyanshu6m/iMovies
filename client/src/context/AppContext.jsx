import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI, bookingAPI } from "../services/api";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [token, setToken]         = useState(null);
  const [bookings, setBookings]   = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading]     = useState(true); // Initial auth check

  // ── Fetch user's bookings from the backend ────────────────────────────────
  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const data = await bookingAPI.getMyBookings();
      if (data && data.bookings) {
        setBookings(data.bookings);
      }
    } catch {
      // Silently fail — bookings are not critical for initial load
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  // ── Restore session on load ───────────────────────────────────────────────
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem("imovies_token");

      if (savedToken) {
        setToken(savedToken);
        try {
          const data = await authAPI.getMe();
          if (data && data.user) {
            setUser(data.user);
            localStorage.setItem("imovies_user", JSON.stringify(data.user));
            // Hydrate real bookings now that we know the user is authenticated
            await fetchBookings();
          }
        } catch (error) {
          console.warn("Session expired or invalid, logging out:", error.message);
          localStorage.removeItem("imovies_token");
          localStorage.removeItem("imovies_user");
          setUser(null);
          setToken(null);
        }
      } else {
        // Fallback: user object cached but no token
        const savedUser = localStorage.getItem("imovies_user");
        if (savedUser) {
          try { setUser(JSON.parse(savedUser)); } catch {
            localStorage.removeItem("imovies_user");
          }
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auth actions ──────────────────────────────────────────────────────────
  const loginUser = async (userData, userToken) => {
    setUser(userData);
    localStorage.setItem("imovies_user", JSON.stringify(userData));
    if (userToken) {
      setToken(userToken);
      localStorage.setItem("imovies_token", userToken);
    }
    // Load the real bookings for the newly signed-in user
    await fetchBookings();
  };

  const logoutUser = async () => {
    try { await authAPI.logout(); } catch { /* continue */ }
    setUser(null);
    setToken(null);
    setBookings([]);
    localStorage.removeItem("imovies_user");
    localStorage.removeItem("imovies_token");
  };

  // ── Booking actions ───────────────────────────────────────────────────────
  /**
   * Add a confirmed booking object returned by the backend to local state
   * (avoids an extra round-trip after a fresh create).
   */
  const addBooking = (booking) => {
    setBookings((prev) => [booking, ...prev]);
  };

  /**
   * Optimistically remove a booking from local state, then confirm via API.
   * Re-fetches full list on failure so state stays consistent.
   */
  const cancelBooking = async (bookingId, reason = "") => {
    setBookings((prev) =>
      prev.map((b) =>
        (b._id || b.id) === bookingId ? { ...b, status: "cancelled" } : b
      )
    );
    try {
      await bookingAPI.cancelBooking(bookingId, reason);
    } catch (err) {
      // Revert on failure
      await fetchBookings();
      throw err;
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        login: loginUser,
        logout: logoutUser,
        bookings,
        bookingsLoading,
        addBooking,
        cancelBooking,
        fetchBookings,
        searchQuery,
        setSearchQuery,
        loading,
        setLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
