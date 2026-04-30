import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import logo from './bg_logo.png';

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        
        {/* Column 1: Brand Info */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo-link">
            <img 
              src={logo} 
              alt="OKOK Tech Logo" 
              className="footer-logo-img"
            />
          </Link>
          <p className="footer-desc">
            Crafting next-gen digital solutions, high-performance platforms, and autonomous AI agents for global brands.
          </p>
          <div className="social-links">
            <a href="#" aria-label="Twitter">𝕏</a>
            <a href="#" aria-label="LinkedIn">In</a>
            <a href="#" aria-label="GitHub">Gh</a>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div className="footer-links">
          <h3>Company</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/projects">Our Projects</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/feedback">Feedback</Link></li>
          </ul>
        </div>

        {/* Column 3: Expertise/Services */}
        <div className="footer-links">
          <h3>Expertise</h3>
          <ul>
            <li><Link to="#">E-commerce Solutions</Link></li>
            <li><Link to="#">Mobile Development</Link></li>
            <li><Link to="#">Autonomous AI Agents</Link></li>
            <li><Link to="#">UI/UX Design</Link></li>
          </ul>
        </div>

        {/* Column 4: Newsletter */}
        <div className="footer-newsletter">
          <h3>Stay Updated</h3>
          <p>Get the latest tech insights and OKOK updates delivered to your inbox.</p>
          <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Enter your email" required />
            <button type="submit" className="btn-subscribe">Subscribe</button>
          </form>
        </div>
        
      </div>

      {/* Bottom Legal Bar */}
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} OKOK Tech. All rights reserved.</p>
        <div className="footer-legal">
          <Link to="#">Privacy Policy</Link>
          <Link to="#">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;