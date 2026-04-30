import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { db } from '../firebase';
import {
  collection, query, where, getDocs,
  addDoc, deleteDoc, doc, updateDoc
} from 'firebase/firestore';
import './Dashboard.css';

// The 7 Stages matching your Admin Panel
const PROJECT_STAGES = [
  'Requirement Analysis & Scope',
  'UI/UX Design & Prototyping',
  'Core Development & Architecture',
  'Client Review & Revisions',
  'Quality Assurance & Testing',
  'Final Deployment & Go-Live',
  'Handover & Post-Launch Support'
];

const STATUS_MAP = {
  Pending:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.25)',  icon: '⏳' },
  Initialized: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.25)',  icon: '📋' },
  Accepted:    { color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.25)',  icon: '✅' },
  Rejected:    { color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.25)', icon: '❌' },
};
const getStatus = (s) => STATUS_MAP[s] || STATUS_MAP['Pending'];

const Dashboard = () => {
  const { currentUser, userName, loading: authLoading } = useContext(UserContext);

  const [myBookings,        setMyBookings]        = useState([]);
  const [myFeedbacks,       setMyFeedbacks]       = useState([]);
  const [fetchingData,      setFetchingData]      = useState(true);
  const [reviewText,        setReviewText]        = useState('');
  const [stars,             setStars]             = useState(5);
  const [hoverStar,         setHoverStar]         = useState(0);
  const [editingFeedbackId, setEditingFeedbackId] = useState(null);
  
  // State for tracking which project to show in the progress modal
  const [progressModalProject, setProgressModalProject] = useState(null);

  useEffect(() => {
    if (currentUser?.email)           fetchDashboardData();
    else if (!authLoading && !currentUser) setFetchingData(false);
  }, [currentUser, authLoading]);

  const fetchDashboardData = async () => {
    setFetchingData(true);
    try {
      // ── Bookings: query by email (new) + name fallback (old) ──
      const bRef   = collection(db, 'bookings');
      const snap1  = await getDocs(query(bRef, where('clientEmail', '==', currentUser.email)));
      let bookings = snap1.docs.map(d => ({ id: d.id, ...d.data() }));

      const displayName = userName || currentUser.displayName || currentUser.email.split('@')[0];
      if (displayName) {
        const snap2  = await getDocs(query(bRef, where('clientName', '==', displayName)));
        const byName = snap2.docs.map(d => ({ id: d.id, ...d.data() }));
        const ids    = new Set(bookings.map(b => b.id));
        byName.forEach(b => { if (!ids.has(b.id)) bookings.push(b); });
      }
      setMyBookings(bookings);

      // ── Feedbacks ──
      const fSnap = await getDocs(query(collection(db, 'feedbacks'), where('userEmail', '==', currentUser.email)));
      setMyFeedbacks(fSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    finally { setFetchingData(false); }
  };

  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    const data = {
      clientName: userName || currentUser.displayName || 'Valued Client',
      name:       userName || currentUser.displayName || 'Valued Client',
      userEmail:  currentUser.email,
      message:    reviewText, review: reviewText,
      rating:     Number(stars), stars: Number(stars),
      createdAt:  new Date(),
    };
    try {
      if (editingFeedbackId) await updateDoc(doc(db, 'feedbacks', editingFeedbackId), data);
      else                   await addDoc(collection(db, 'feedbacks'), data);
      setReviewText(''); setStars(5); setEditingFeedbackId(null);
      fetchDashboardData();
    } catch (e) { console.error(e); }
  };

  const handleEditFeedback   = (fb) => { setEditingFeedbackId(fb.id); setReviewText(fb.review || fb.message || ''); setStars(fb.stars || fb.rating || 5); };
  const handleDeleteFeedback = async (id) => { if (window.confirm('Delete this review?')) { await deleteDoc(doc(db, 'feedbacks', id)); fetchDashboardData(); } };

  // Helper function to guarantee the URL doesn't get attached to the domain
  const formatUrl = (url) => {
    if (!url) return '#';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
    }
    return url;
  };

  // ── Guards ──
  if (authLoading || fetchingData) return (
    <div className="db-splash">
      <div className="db-splash-spinner" />
      <p className="db-splash-text">{authLoading ? 'Verifying session…' : 'Loading your dashboard…'}</p>
    </div>
  );

  if (!currentUser) return (
    <div className="db-splash">
      <h2 className="db-splash-err">Access Denied</h2>
      <p>Please login to view your dashboard.</p>
      <a href="/login" className="db-btn-primary">Go to Login</a>
    </div>
  );

  const displayName = userName || currentUser.displayName || 'User';
  const memberSince = new Date(currentUser.metadata.creationTime)
    .toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="db-root">
      {/* Background */}
      <div className="db-orb db-orb--a" />
      <div className="db-orb db-orb--b" />
      <div className="db-orb db-orb--c" />
      <div className="db-grid" />

      <div className="db-page">

        {/* ════════════════════════════════
            TOP HERO BANNER
           ════════════════════════════════ */}
        <header className="db-hero">
          <div className="db-hero-left">
            <div className="db-hero-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="db-hero-text">
              <p className="db-hero-greeting">Good day,</p>
              <h1 className="db-hero-name">{displayName}</h1>
              <p className="db-hero-email">{currentUser.email}</p>
            </div>
          </div>

          <div className="db-hero-stats">
            <div className="db-hero-stat">
              <span className="db-hero-stat-val">{myBookings.length}</span>
              <span className="db-hero-stat-key">Projects</span>
            </div>
            <div className="db-hero-divider" />
            <div className="db-hero-stat">
              <span className="db-hero-stat-val">{myFeedbacks.length}</span>
              <span className="db-hero-stat-key">Reviews</span>
            </div>
            <div className="db-hero-divider" />
            <div className="db-hero-stat">
              <span className="db-hero-stat-val db-hero-stat-val--sm">{memberSince}</span>
              <span className="db-hero-stat-key">Member Since</span>
            </div>
          </div>
        </header>

        {/* ════════════════════════════════
            TWO - COLUMN BODY
           ════════════════════════════════ */}
        <div className="db-body">

          {/* ── LEFT COLUMN: Projects ── */}
          <div className="db-col">
            <div className="db-panel">
              <div className="db-panel-head">
                <div className="db-panel-head-left">
                  <span className="db-panel-icon">🚀</span>
                  <h2 className="db-panel-title">Active Projects</h2>
                </div>
                {myBookings.length > 0 && (
                  <span className="db-badge">{myBookings.length}</span>
                )}
              </div>

              <div className="db-panel-body">
                {myBookings.length === 0 ? (
                  <div className="db-empty-state">
                    <span className="db-empty-icon">📭</span>
                    <p className="db-empty-title">No projects yet</p>
                    <p className="db-empty-sub">Book a product to get started</p>
                    <a href="/products" className="db-btn-primary db-btn-sm">Browse Products →</a>
                  </div>
                ) : (
                  <div className="db-project-list">
                    {myBookings.map(b => {
                      const st = getStatus(b.status || 'Pending');
                      return (
                        <div className="db-project-card" key={b.id}>
                          <div className="db-project-accent" style={{ background: st.color }} />
                          <div className="db-project-main">
                            <div className="db-project-row">
                              <h3 className="db-project-name">{b.product}</h3>
                              <span className="db-status-pill" style={{ color: st.color, background: st.bg, border: `1px solid ${st.border}` }}>
                                {st.icon} {b.status || 'Pending'}
                              </span>
                            </div>
                            {b.date && (
                              <p className="db-project-date">
                                Booked {new Date(b.date.seconds ? b.date.seconds * 1000 : b.date)
                                  .toLocaleDateString('en-US', { day:'numeric', month:'short', year:'numeric' })}
                              </p>
                            )}
                            
                            {/* Project Tracker Button for Accepted Projects */}
                            {b.status === 'Accepted' && (
                                <button 
                                  className="db-btn-primary db-btn-sm" 
                                  style={{ marginTop: '10px', backgroundColor: '#40c9a2', borderColor: '#40c9a2' }}
                                  onClick={() => setProgressModalProject(b)}
                                >
                                  📊 View Progress Tracker
                                </button>
                            )}

                            {b.adminMessage && (
                              <div className="db-project-msg">
                                <p className="db-project-msg-text">{b.adminMessage}</p>
                                {b.meetingLink && (
                                  <a href={formatUrl(b.meetingLink)} target="_blank" rel="noopener noreferrer" className="db-meeting-btn">
                                    ↗ Join Meeting
                                  </a>
                                )}
                                {b.meetingDate && (
                                  <p className="db-meeting-when">📅 {b.meetingDate} &nbsp; ⏰ {b.meetingTime}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Reviews ── */}
          <div className="db-col">

            {/* Reviews list */}
            <div className="db-panel">
              <div className="db-panel-head">
                <div className="db-panel-head-left">
                  <span className="db-panel-icon">⭐</span>
                  <h2 className="db-panel-title">My Reviews</h2>
                </div>
                {myFeedbacks.length > 0 && (
                  <span className="db-badge">{myFeedbacks.length}</span>
                )}
              </div>

              <div className="db-panel-body">
                {myFeedbacks.length === 0 ? (
                  <p className="db-no-reviews">No reviews yet. Leave one below!</p>
                ) : (
                  <div className="db-review-list">
                    {myFeedbacks.map(fb => {
                      const rating = fb.stars || fb.rating || 0;
                      return (
                        <div className="db-review-card" key={fb.id}>
                          <div className="db-review-stars">
                            {[1,2,3,4,5].map(n => (
                              <span key={n} className={n <= rating ? 'db-star db-star--on' : 'db-star'}>★</span>
                            ))}
                          </div>
                          <p className="db-review-text">"{fb.review || fb.message}"</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Write review form */}
            <div className="db-panel db-panel--form">
              <div className="db-panel-head">
                <div className="db-panel-head-left">
                  <span className="db-panel-icon">✍️</span>
                  <h2 className="db-panel-title">{editingFeedbackId ? 'Edit Review' : 'Write a Review'}</h2>
                </div>
              </div>

              <div className="db-panel-body">
                <form className="db-form" onSubmit={handleSaveFeedback}>
                  {/* Star picker */}
                  <div className="db-form-group">
                    <label className="db-label">Your Rating</label>
                    <div className="db-star-row">
                      {[1,2,3,4,5].map(n => (
                        <button
                          key={n} type="button"
                          className={`db-star-pick${n <= (hoverStar || stars) ? ' db-star-pick--on' : ''}`}
                          onMouseEnter={() => setHoverStar(n)}
                          onMouseLeave={() => setHoverStar(0)}
                          onClick={() => setStars(n)}
                        >★</button>
                      ))}
                      <span className="db-star-val">{stars} / 5</span>
                    </div>
                  </div>

                  {/* Textarea */}
                  <div className="db-form-group">
                    <label className="db-label">Your Review</label>
                    <textarea
                      className="db-textarea"
                      value={reviewText}
                      onChange={e => setReviewText(e.target.value)}
                      placeholder="Share your experience with our team…"
                      required
                    />
                  </div>

                  <div className="db-form-btns">
                    <button type="submit" className="db-btn-primary">
                      {editingFeedbackId ? 'Update Review' : 'Post Review'}
                    </button>
                    {editingFeedbackId && (
                      <button type="button" className="db-btn-ghost"
                        onClick={() => { setEditingFeedbackId(null); setReviewText(''); setStars(5); }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

          </div>{/* end right col */}
        </div>{/* end db-body */}
      </div>{/* end db-page */}

      {/* ════════════════════════════════
          PROGRESS TRACKER MODAL
         ════════════════════════════════ */}
      {progressModalProject && (
        <div 
          onClick={() => setProgressModalProject(null)} 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            style={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto', color: '#fff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.5rem' }}>Project Lifecycle</h3>
              <button onClick={() => setProgressModalProject(null)} style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '2rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            
            <p style={{ color: '#40c9a2', marginBottom: '2rem', fontWeight: 'bold' }}>{progressModalProject.product}</p>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {PROJECT_STAGES.map((stage, index) => {
                const step = index + 1;
                const current = progressModalProject.currentStage || 1;
                const isCompleted = step < current;
                const isCurrent = step === current;
                const isPending = step > current;

                let circleBg = '#222';
                let circleColor = '#555';
                let borderColor = '#333';
                
                if (isCompleted) { 
                  circleBg = '#166534'; // Dark green
                  circleColor = '#4ade80'; // Light green text
                  borderColor = '#166534'; 
                } else if (isCurrent) { 
                  circleBg = '#1e3a8a'; // Dark blue
                  circleColor = '#60a5fa'; // Light blue text
                  borderColor = '#3b82f6'; // Bright blue border
                }

                return (
                  <div key={step} style={{ display: 'flex', alignItems: 'flex-start', opacity: isPending ? 0.4 : 1, position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px' }}>
                      <div style={{ 
                        width: '32px', height: '32px', borderRadius: '50%', backgroundColor: circleBg, color: circleColor, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem', 
                        flexShrink: 0, border: `2px solid ${borderColor}`, zIndex: 2
                      }}>
                        {isCompleted ? '✓' : step}
                      </div>
                      
                      {/* Vertical line connecting the steps */}
                      {step < 7 && (
                        <div style={{ 
                          width: '2px', height: '50px', 
                          backgroundColor: isCompleted ? '#166534' : '#333',
                          margin: '-2px 0' // Slight overlap to connect perfectly
                        }} />
                      )}
                    </div>
                    
                    <div style={{ paddingTop: '5px', paddingLeft: '15px', paddingBottom: step < 7 ? '30px' : '0' }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: isCurrent ? '#fff' : (isCompleted ? '#cbd5e1' : '#888') }}>
                        {stage}
                      </h4>
                      {isCurrent && (
                        <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '0.75rem', backgroundColor: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                          ● IN PROGRESS
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            <button 
              onClick={() => setProgressModalProject(null)}
              style={{ width: '100%', padding: '12px', marginTop: '2rem', backgroundColor: '#222', color: '#fff', border: '1px solid #444', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'background-color 0.2s' }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#333'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#222'}
            >
              Close Tracker
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;