import React, { useState, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import './Navbar.css'; 
import logo from './bg_logo.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const { userName, role, logout } = useContext(UserContext);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false); 
    navigate('/login'); 
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        
        {/* Simplified Logo Section - styles moved to CSS for cleaner code */}
        <NavLink to="/home" className="nav-logo">
          <img 
            src={logo} 
            alt="OKOK Tech" 
          />
        </NavLink>

        {/* Desktop Menu */}
        <div className="desktop-menu">
          <div className="nav-links-group">
            <NavLink to="/home" className="nav-link">Home</NavLink>
            <NavLink to="/products" className="nav-link">Products</NavLink>
            <NavLink to="/projects" className="nav-link">Projects</NavLink>
            <NavLink to="/feedback" className="nav-link">Feedback</NavLink>
            <NavLink to="/about" className="nav-link">About Us</NavLink>
            
            {userName && role === 'admin' && (
              <NavLink to="/admin" className="nav-link" style={{ color: '#ffeb3b', fontWeight: 'bold' }}>
                Admin Panel
              </NavLink>
            )}
            {userName && role !== 'admin' && (
              <NavLink to="/dashboard" className="nav-link" style={{ color: '#ffffff', fontWeight: 'bold' }}>
                Dashboard
              </NavLink>
            )}
          </div>
          
          <div className="nav-actions">
            {userName ? (
              <>
                <div className="profile-wrapper">
                  <svg className="profile-icon" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  <span className="profile-name">{userName}</span>
                </div>
                
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </>
            ) : (
              <NavLink to="/login" className="login-btn">Login</NavLink>
            )}
          </div>
        </div>

        {/* Mobile menu hamburger button */}
        <button
          onClick={toggleMenu}
          className="mobile-menu-btn"
          aria-label="Toggle menu"
        >
          {!isOpen ? (
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          ) : (
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="mobile-menu">
          <NavLink to="/home" onClick={toggleMenu} className="nav-link">Home</NavLink>
          <NavLink to="/products" onClick={toggleMenu} className="nav-link">Products</NavLink>
          <NavLink to="/projects" onClick={toggleMenu} className="nav-link">Projects</NavLink>
          <NavLink to="/feedback" onClick={toggleMenu} className="nav-link">Feedback</NavLink>
          <NavLink to="/about" onClick={toggleMenu} className="nav-link">About Us</NavLink>
          
          {userName ? (
            <>
              {role === 'admin' ? (
                <NavLink to="/admin" onClick={toggleMenu} className="nav-link" style={{ color: '#ffeb3b', fontWeight: 'bold' }}>Admin Panel</NavLink>
              ) : (
                <NavLink to="/dashboard" onClick={toggleMenu} className="nav-link" style={{ color: '#60a5fa', fontWeight: 'bold' }}>Dashboard</NavLink>
              )}
              
              <div className="mobile-profile-wrapper">
                <svg className="profile-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span className="profile-name">{userName}</span>
              </div>

              <button onClick={handleLogout} className="logout-btn mobile-logout">Logout</button>
            </>
          ) : (
            <NavLink to="/login" onClick={toggleMenu} className="login-btn">Login</NavLink>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;