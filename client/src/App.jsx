import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Movies from "./pages/Movies";
import MovieDetails from "./pages/MovieDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyBookings from "./pages/MyBookings";
import Theatres from "./pages/Theatres";
import "./App.css";

function ScrollToTop() {
  const { pathname } = window.location;
  return null;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app">
          <Navbar />
          <main className="app__main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/movie/:id" element={<MovieDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/theatres" element={<Theatres />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

function NotFound() {
  return (
    <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", color: "rgba(255,255,255,0.5)" }}>
      <span style={{ fontSize: "4rem" }}>🎬</span>
      <h2 style={{ color: "#fff", fontSize: "1.5rem", margin: 0 }}>Page Not Found</h2>
      <p style={{ margin: 0 }}>The page you're looking for doesn't exist.</p>
      <a href="/" style={{ color: "#e50914", fontWeight: 700, textDecoration: "none" }}>← Back to Home</a>
    </div>
  );
}
