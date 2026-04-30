import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import './Home.css';

/* ─── Marquee data ─── */
const MARQUEE_ITEMS = [
  'E-commerce Solutions',
  'Mobile Development',
  'AI Agents',
  'UI / UX Design',
  'API Integrations',
  'Cloud Deployment',
  'Performance Optimization',
  'Brand Strategy',
];

/* ─── Booking options shown in the card ─── */
const BOOKING_OPTIONS = [
  { icon: '🛒', label: 'E-commerce Build',   sub: 'Shopify / Headless',     price: 'From $1,200', id: 'ecom' },
  { icon: '📱', label: 'Mobile App',          sub: 'React Native',           price: 'From $2,500', id: 'app'  },
  { icon: '🤖', label: 'AI Agent Setup',      sub: 'Custom Workflows',       price: 'From $800',   id: 'ai'   },
];

/* ─── Process steps ─── */
const STEPS = [
  { n: '01', title: 'Pick a Service',    desc: 'Browse our core offerings and select what fits your goal.' },
  { n: '02', title: 'Book a Slot',       desc: 'Choose a time directly — no email chains, no waiting.' },
  { n: '03', title: 'We Scope It',       desc: 'A quick 30-min call to align on scope, timeline & cost.' },
  { n: '04', title: 'We Deliver',        desc: 'Agile sprints with live previews so you stay in the loop.' },
];

/* ─── Testimonials ─── */
const TESTIMONIALS = [
  {
    text: 'OKOK TECH shipped our Shopify store in 3 weeks. Revenue doubled in the first month. The team is exceptional.',
    name: 'Sarah K.', role: 'Founder, Luminary Co.', initials: 'SK', color: '#40c9a2',
  },
  {
    text: 'Their AI agent handles 80% of our customer support automatically. An absolute game-changer for our ops.',
    name: 'Rahul M.', role: 'CTO, NovaPay', initials: 'RM', color: '#80a4ed',
  },
  {
    text: 'Best mobile dev team we\'ve worked with. Clean code, on-time delivery, and they actually listen.',
    name: 'Priya D.', role: 'Product Lead, FlexWork', initials: 'PD', color: '#f6c90e',
  },
];

/* ─── Marquee strip (renders items twice for seamless loop) ─── */
const MarqueeStrip = () => {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]; // doubled for seamless loop
  return (
    <section className="marquee-section" aria-hidden="true">
      <div className="marquee-track">
        {[0, 1].map(copy =>
          <div className="marquee-content" key={copy}>
            {MARQUEE_ITEMS.map((item, i) => (
              <span className="marquee-item" key={`${copy}-${i}`}>
                <span className="marquee-dot" />
                {item}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

/* ─── Main Component ─── */
const Home = () => {
  const [stats, setStats] = useState({ totalProjects: '...', happyClients: '...', satisfaction: '...' });
  const [activeOption, setActiveOption] = useState('ecom');

  useEffect(() => {
    const fetchStats = async () => {
      const statsDoc = await getDoc(doc(db, 'settings', 'homeStats'));
      if (statsDoc.exists()) setStats(statsDoc.data());
    };
    fetchStats();
  }, []);

  return (
    <div className="home-container">

      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="hero-content">
          {/* <span className="hero-eyebrow">🚀 Trusted by 50+ global brands</span> */}
          <h1 className="hero-title">
            Next-Gen Digital Solutions for<span>Global Brands</span>
          </h1>
          <p className="hero-subtitle">
            OKOK TECH specializes in building high-performance e-commerce platforms,
            intuitive mobile applications, and autonomous AI agents that scale with you.
          </p>
          <div className="hero-buttons">
            <Link to="/projects" className="btn-primary">View Our Work</Link>
            <Link to="/about" className="btn-outline">Learn More</Link>
          </div>
        </div>
      </section>

      {/* ── Scrolling Marquee ── */}
      <MarqueeStrip />

      {/* ── Stats ── */}
      <section className="stats-section">
        <div className="stat-item">
          <h2 className="stat-value">{stats.totalProjects}</h2>
          <p className="stat-label">Projects Completed</p>
        </div>
        <div className="stat-item">
          <h2 className="stat-value">{stats.happyClients}</h2>
          <p className="stat-label">Happy Clients</p>
        </div>
        <div className="stat-item">
          <h2 className="stat-value">{stats.satisfaction}</h2>
          <p className="stat-label">Satisfaction Rate</p>
        </div>
      </section>

      {/* ── Services ── */}
      <section className="services-section">
        <div className="section-header">
          <span className="section-eyebrow">What we do</span>
          <h2 className="section-title">Our Core Expertise</h2>
          <p className="section-subtitle" >End-to-end digital solutions crafted to push your business forward.</p>
          <div className="section-divider" />
        </div>
        <div className="services-grid">
          {[
            { icon: '🛒', title: 'E-commerce Solutions', desc: 'Custom Shopify and headless commerce stores built for conversion and scale.', tag: 'Shopify · Headless' },
            { icon: '📱', title: 'Mobile Development',   desc: 'Native and cross-platform mobile apps built with React Native for iOS & Android.', tag: 'React Native · iOS · Android' },
            { icon: '🤖', title: 'Autonomous AI Agents', desc: 'Intelligent AI workflows for automated customer support, ops, and analytics.', tag: 'LLM · Automation · APIs' },
          ].map(({ icon, title, desc, tag }) => (
            <div className="service-card" key={title}>
              <span className="service-icon">{icon}</span>
              <h3 className="service-title">{title}</h3>
              <p className="service-desc">{desc}</p>
              <span className="service-tag">{tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="how-section">
        <div className="how-inner">
          <div className="section-header">
            <span className="section-eyebrow">The process</span>
            <h2 className="section-title">From Idea to Launch in 4 Steps</h2>
            <p className="section-subtitle">A streamlined, transparent process so you always know what's happening.</p>
            <div className="section-divider" />
          </div>
          <div className="steps-grid">
            {STEPS.map(({ n, title, desc }) => (
              <div className="step-card" key={n}>
                <div className="step-number">{n}</div>
                <h3 className="step-title">{title}</h3>
                <p className="step-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Book Your Product ── */}
      <section className="booking-section" id="book">
        <div className="booking-inner">

          {/* Left: text */}
          <div className="booking-text">
            <div className="booking-badge">
              <span className="booking-badge-dot" />
              Book in one touch
            </div>
            <h2 className="booking-title">
              Ready to build<br />
              <span className="highlight">something great?</span>
            </h2>
            <p className="booking-desc">
              No lengthy proposals. No back-and-forth emails. Pick your service,
              book a slot, and let's get moving — fast.
            </p>
            <ul className="booking-perks">
              {[
                'Free 30-min discovery call included',
                'Fixed-price quotes — no hidden fees',
                'Dedicated project manager from day one',
              ].map(perk => (
                <li key={perk}>
                  <span className="perk-check">✓</span>
                  {perk}
                </li>
              ))}
            </ul>
            <Link to="/products" className="btn-book">
              Book Your Project
              <span className="btn-book-icon">→</span>
            </Link>
          </div>

          {/* Right: interactive card */}
          <div className="booking-card">
            <div className="booking-card-header">
              <span className="booking-card-title">Select a Service</span>
              <span className="booking-card-status">
                <span className="status-dot" /> Available now
              </span>
            </div>

            <div className="booking-options">
              {BOOKING_OPTIONS.map(opt => (
                <div
                  key={opt.id}
                  className={`booking-option${activeOption === opt.id ? ' active' : ''}`}
                  onClick={() => setActiveOption(opt.id)}
                >
                  <span className="booking-option-icon">{opt.icon}</span>
                  <div>
                    <div className="booking-option-label">{opt.label}</div>
                    <div className="booking-option-sub">{opt.sub}</div>
                  </div>
                  {/* <span className="booking-option-price">{opt.price}</span> */}
                </div>
              ))}
            </div>

            <div className="booking-cta-row">
              <Link to="/products" className="btn-card-book" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                Book This Now →
              </Link>
            </div>
            <p className="booking-card-note">No payment required to book · Cancel anytime</p>
          </div>

        </div>
      </section>

      {/* ── Testimonials ── */}
      {/* <section className="trust-section">
        <div className="trust-inner">
          <div className="section-header">
            <span className="section-eyebrow">Client voices</span>
            <h2 className="section-title">Trusted by Builders Worldwide</h2>
            <p className="section-subtitle">Don't take our word for it — here's what our clients say.</p>
            <div className="section-divider" />
          </div>
          <div className="testimonials-grid">
            {TESTIMONIALS.map(({ text, name, role, initials, color }) => (
              <div className="testimonial-card" key={name}>
                <div className="testimonial-stars">
                  {[...Array(5)].map((_, i) => <span className="star" key={i}>★</span>)}
                </div>
                <p className="testimonial-text">{text}</p>
                <div className="testimonial-author">
                  <div className="author-avatar" style={{ background: color }}>{initials}</div>
                  <div>
                    <div className="author-name">{name}</div>
                    <div className="author-role">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ── Final CTA ── */}
      {/* <section className="cta-section">
        <div className="cta-inner">
          <h2 className="cta-title">Start your project <span>today</span></h2>
          <p className="cta-desc">
            Join 50+ brands already growing with OKOK TECH. One conversation
            is all it takes to get started.
          </p>
          <div className="cta-buttons">
            <Link to="/contact" className="btn-primary">Get a Free Quote</Link>
            <Link to="/projects" className="btn-outline">See Case Studies</Link>
          </div>
        </div>
      </section> */}

    </div>
  );
};

export default Home;