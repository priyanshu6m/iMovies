import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  Film,
  Search,
  Menu,
  X,
  Ticket,
  User,
  LogOut,
  ChevronDown,
  Home,
  Clapperboard,
  Building2,
} from "lucide-react";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout, searchQuery, setSearchQuery } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setUserDropdown(false);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
    }
  };

  const navLinks = [
    { to: "/", label: "Home", icon: <Home size={16} /> },
    { to: "/movies", label: "Movies", icon: <Clapperboard size={16} /> },
    { to: "/theatres", label: "Theatres", icon: <Building2 size={16} /> },
    { to: "/my-bookings", label: "My Bookings", icon: <Ticket size={16} /> },
  ];

  return (
    <nav className={`navbar${scrolled ? " navbar--scrolled" : ""}`}>
      <div className="navbar__inner">
        {/* Logo */}
        <Link to="/" className="navbar__logo" id="navbar-logo">
          <Film size={28} className="navbar__logo-icon" />
          <span>
            i<span className="navbar__logo-accent">Movies</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <ul className="navbar__links">
          {navLinks.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={`navbar__link${location.pathname === link.to ? " navbar__link--active" : ""}`}
                id={`nav-${link.label.toLowerCase().replace(" ", "-")}`}
              >
                {link.icon}
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right controls */}
        <div className="navbar__right">
          {/* Search */}
          <div className={`navbar__search-wrap${searchOpen ? " navbar__search-wrap--open" : ""}`}>
            <form onSubmit={handleSearch} className="navbar__search-form">
              <input
                type="text"
                id="navbar-search-input"
                placeholder="Search movies…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="navbar__search-input"
                autoFocus={searchOpen}
              />
              <button type="submit" className="navbar__search-btn" aria-label="Search">
                <Search size={18} />
              </button>
            </form>
          </div>
          <button
            className="navbar__icon-btn"
            id="navbar-search-toggle"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Toggle search"
          >
            <Search size={20} />
          </button>

          {user ? (
            <div className="navbar__user" id="navbar-user">
              <button
                className="navbar__user-btn"
                onClick={() => setUserDropdown((v) => !v)}
                id="navbar-user-btn"
              >
                <div className="navbar__avatar">{user.name?.[0]?.toUpperCase() ?? "U"}</div>
                <span className="navbar__user-name">{user.name?.split(" ")[0]}</span>
                <ChevronDown
                  size={14}
                  className={`navbar__chevron${userDropdown ? " navbar__chevron--open" : ""}`}
                />
              </button>
              {userDropdown && (
                <div className="navbar__dropdown" id="navbar-dropdown">
                  <Link to="/my-bookings" className="navbar__dropdown-item" id="dropdown-bookings">
                    <Ticket size={15} /> My Bookings
                  </Link>
                  <button
                    className="navbar__dropdown-item navbar__dropdown-item--danger"
                    onClick={logout}
                    id="dropdown-logout"
                  >
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="navbar__auth-btns">
              <Link to="/login" className="navbar__btn navbar__btn--ghost" id="navbar-login">
                Login
              </Link>
              <Link to="/register" className="navbar__btn navbar__btn--primary" id="navbar-register">
                Register
              </Link>
            </div>
          )}

          {/* Hamburger */}
          <button
            className="navbar__hamburger"
            id="navbar-hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="navbar__mobile" id="navbar-mobile-menu">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`navbar__mobile-link${location.pathname === link.to ? " navbar__mobile-link--active" : ""}`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
          {!user ? (
            <div className="navbar__mobile-auth">
              <Link to="/login" className="navbar__btn navbar__btn--ghost">
                Login
              </Link>
              <Link to="/register" className="navbar__btn navbar__btn--primary">
                Register
              </Link>
            </div>
          ) : (
            <button className="navbar__mobile-link navbar__mobile-link--danger" onClick={logout}>
              <LogOut size={16} /> Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
