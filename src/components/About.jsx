import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import './About.css';

/* ── Company values ── */
const VALUES = [
  { icon: '⚡', title: 'Speed First',      desc: 'We move fast without breaking things. Rapid delivery is in our DNA.' },
  { icon: '🎯', title: 'Precision',        desc: 'Every pixel, every line of code is intentional and crafted with care.' },
  { icon: '🤝', title: 'Transparency',     desc: 'No surprises. Fixed pricing, clear timelines, open communication always.' },
  { icon: '🚀', title: 'Innovation',       desc: 'We push boundaries with AI, automation, and cutting-edge tech stacks.' },
];

/* ── Company milestones ── */
const MILESTONES = [
  { year: '2019', event: 'OKOK TECH founded with a 3-person team.' },
  { year: '2020', event: 'First 10 global clients onboarded.' },
  { year: '2021', event: 'Launched AI automation service line.' },
  { year: '2022', event: 'Crossed 50+ successful project deliveries.' },
  { year: '2023', event: 'Expanded to mobile & cross-platform solutions.' },
  { year: '2024', event: 'Reached 100+ happy clients worldwide.' },
];

/* ── Skill pill colours ── */
const PILL_COLORS = ['#40c9a2', '#80a4ed', '#f6c90e', '#ff6b6b', '#c77dff', '#ff9f43', '#26de81'];
const getPillColor = (i) => PILL_COLORS[i % PILL_COLORS.length];

/* ── Department badge colours ── */
const DEPT_COLORS = {
  Engineering:  { bg: 'rgba(64,201,162,0.12)',  text: '#40c9a2' },
  Design:       { bg: 'rgba(128,164,237,0.12)', text: '#80a4ed' },
  Marketing:    { bg: 'rgba(246,201,14,0.12)',  text: '#c9a500' },
  Management:   { bg: 'rgba(255,107,107,0.12)', text: '#ff6b6b' },
  Sales:        { bg: 'rgba(199,125,255,0.12)', text: '#c77dff' },
  Operations:   { bg: 'rgba(255,159,67,0.12)',  text: '#ff9f43' },
};
const getDeptStyle = (dept) => DEPT_COLORS[dept] || { bg: 'rgba(64,201,162,0.12)', text: '#40c9a2' };

const About = () => {
  const [employees, setEmployees]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeFilter, setFilter]   = useState('All');
  const [hoveredEmp, setHoveredEmp] = useState(null);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'employees'));
      setEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    })();
  }, []);

  /* ── Unique departments for filter pills ── */
  const departments = ['All', ...new Set(employees.map(e => e.department).filter(Boolean))];

  const filtered = activeFilter === 'All'
    ? employees
    : employees.filter(e => e.department === activeFilter);

  return (
    <div className="about-root">

      <section className="about-mission-section">
        <div className="about-section-inner">
          <div className="about-mv-grid">
            <div className="about-mv-card about-mv-card--mission">
              <div className="about-mv-icon">🎯</div>
              <h3 className="about-mv-title">Our Mission</h3>
              <p className="about-mv-text">
                To democratize world-class digital solutions for businesses of all sizes —
                from indie founders to enterprise brands — without compromise on quality or speed.
              </p>
            </div>
            <div className="about-mv-card about-mv-card--vision">
              <div className="about-mv-icon">🔭</div>
              <h3 className="about-mv-title">Our Vision</h3>
              <p className="about-mv-text">
                A world where any business can deploy intelligent, beautifully crafted digital products
                in days, not months — powered by the best human talent and AI collaboration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          VALUES
         ════════════════════════════════ */}
      <section className="about-values-section">
        <div className="about-section-inner">
          <div className="about-section-header">
            <span className="about-eyebrow">What Drives Us</span>
            <h2 className="about-section-title">Our Core Values</h2>
            <div className="about-divider" />
          </div>
          <div className="about-values-grid">
            {VALUES.map(({ icon, title, desc }, i) => (
              <div className="about-value-card" key={title} style={{ '--vi': i }}>
                <div className="about-value-icon">{icon}</div>
                <h4 className="about-value-title">{title}</h4>
                <p className="about-value-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
export default About;