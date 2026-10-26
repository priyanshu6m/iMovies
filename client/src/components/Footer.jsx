import { Link } from "react-router-dom";
import { Film,   Mail, Phone } from "lucide-react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__glow" />
      <div className="footer__inner">
        <div className="footer__brand">
          <Link to="/" className="footer__logo">
            <Film size={26} />
            i<span>Movies</span>
          </Link>
          <p className="footer__tagline">
            Your premium gateway to unforgettable cinema experiences.
          </p>
          <div className="footer__social">
            
            
            
            
          </div>
        </div>

        <div className="footer__col">
          <h4>Explore</h4>
          <Link to="/movies">Now Showing</Link>
          <Link to="/movies?filter=upcoming">Upcoming Movies</Link>
          <Link to="/theatres">Theatres</Link>
          <Link to="/my-bookings">My Bookings</Link>
        </div>

        <div className="footer__col">
          <h4>Company</h4>
          <a href="#">About Us</a>
          <a href="#">Careers</a>
          <a href="#">Press</a>
          <a href="#">Blog</a>
        </div>

        <div className="footer__col">
          <h4>Support</h4>
          <a href="#"><Mail size={14} /> support@imovies.in</a>
          <a href="#"><Phone size={14} /> 1800-123-4567</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>

      <div className="footer__bottom">
        <p>© {new Date().getFullYear()} iMovies. All rights reserved. Crafted with ❤️ for cinema lovers.</p>
      </div>
    </footer>
  );
}
