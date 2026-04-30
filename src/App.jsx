import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginorSignUp from './components/LoginorSignUp';
import Home from './components/Home';
import Products from './components/Products';
import Projects from './components/Projects';
import Testimonial from './components/Testimonial';
import About from './components/About';
import StickyNavbar from './NavFoot/Navbar';
import './App.css';
import Footer from './NavFoot/Footer';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  return (
    <Router>
      <div>
        <div className="app-wrapper"> 
        <StickyNavbar/>
        <Routes>
          {/* Default route so the root URL shows the Home page */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginorSignUp />} />
          <Route path="/home" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/feedback" element={<Testimonial />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
        </div>
        <Footer/>
      </div>
    </Router>
  );
}

export default App;