import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { UserContext } from '../context/UserContext';
import CircularGallery from './CircularGallery';
import './Products.css';

const ACCENTS = ['#40c9a2', '#80a4ed', '#f6c90e', '#ff6b6b', '#c77dff', '#ff9f43'];
const TAGS    = ['Trending', 'New', 'Popular', 'Pro', 'Exclusive', 'Hot'];
const getAccent = (i) => ACCENTS[i % ACCENTS.length];
const getTag    = (i) => TAGS[i % TAGS.length];

// PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby46D3TpUbIxM32T4RfbtP1JJgHokz-qG9EqGrcB2G_kjWTvTNDFcKKrzo2ikQ6sjwU/exec';

const useTilt = () => {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (e.clientX - left) / width  - 0.5;
    const y = (e.clientY - top)  / height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) scale(1.03)`;
    el.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
    el.style.setProperty('--my', `${(y + 0.5) * 100}%`);
  };
  const onLeave = () => {
    if (ref.current)
      ref.current.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) scale(1)';
  };
  return { ref, onMouseMove: onMove, onMouseLeave: onLeave };
};

const ProductCard = ({ product, index, onClick }) => {
  const { ref, onMouseMove, onMouseLeave } = useTilt();
  return (
    <div
      ref={ref}
      className="pcard"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={() => onClick(product)}
      style={{ '--accent': getAccent(index), '--index': index }}
    >
      <div className="pcard-shimmer" />
      <div className="pcard-img-wrap">
        <img
          src={product.imageUrl || `https://picsum.photos/seed/${product.id || index}/600/400`}
          alt={product.name} className="pcard-img" loading="lazy"
        />
        <div className="pcard-img-overlay" />
      </div>
      <span className="pcard-tag">{getTag(index)}</span>
      <span className="pcard-num">{String(index + 1).padStart(2, '0')}</span>
      <div className="pcard-body">
        <h3 className="pcard-name">{product.name}</h3>
        <p className="pcard-desc">
          {product.desc ? product.desc.slice(0, 80) + (product.desc.length > 80 ? '…' : '') : 'Premium digital solution crafted by OKOK TECH.'}
        </p>
        <div className="pcard-footer">
          <span className="pcard-cta">View & Book →</span>
          <span className="pcard-dot" />
        </div>
      </div>
    </div>
  );
};

const SuccessOverlay = ({ name, onClose }) => (
  <div className="success-overlay" onClick={onClose}>
    <div className="success-box" onClick={e => e.stopPropagation()}>
      <div className="success-icon">✓</div>
      <h3 className="success-title">Booking Sent!</h3>
      <p className="success-sub">Your request for <strong>{name}</strong> has been received. We'll reach out shortly.</p>
      <button className="success-close" onClick={onClose}>Done</button>
    </div>
  </div>
);

const Products = () => {
  const { userName, currentUser } = useContext(UserContext);

  const [products, setProducts]               = useState([]);
  const [search, setSearch]                   = useState('');
  const [loading, setLoading]                 = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [view, setView]                       = useState('gallery');
  const [booking, setBooking]                 = useState(false);
  const [booked, setBooked]                   = useState(null);
  const [searchFocus, setSearchFocus]         = useState(false);
  
  // New State for the expanded Booking Form
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [formData, setFormData]               = useState({
    clientName: '',
    clientEmail: '',
    phone: '',
    description: ''
  });

  // Pre-fill user data when a user logs in
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        clientName: userName || currentUser.displayName || currentUser.email.split('@')[0],
        clientEmail: currentUser.email
      }));
    }
  }, [currentUser, userName]);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'products'));
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(
    () => products.filter(p => (p.name || '').toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  const galleryItems = useMemo(
    () => filtered.map((p, i) => ({
      image: p.imageUrl || `https://picsum.photos/seed/${p.id || i}/800/600`,
      text: p.name,
      originalProductData: p,
    })),
    [filtered]
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
    setShowBookingForm(false);
  };

  // ✅ Handles full form submission to BOTH Firebase and Google Sheets
  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Please login to book a product!');
      return;
    }
    
    setBooking(true);
    try {
      // 1. Save to Firebase Firestore
      await addDoc(collection(db, 'bookings'), {
        clientName:  formData.clientName,
        clientEmail: formData.clientEmail,
        phone:       formData.phone,
        description: formData.description,
        product:     selectedProduct.name,
        status:      'Pending',
        date:        new Date(),
      });

      // 2. Save to Google Sheets via Apps Script
      const sheetData = {
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        phoneNumber: formData.phone,
        serviceType: selectedProduct.name, // Sending the product name as the service type
        projectDetails: formData.description
      };

      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8', 
        },
        body: JSON.stringify(sheetData),
      });

      // Cleanup on success
      closeProductModal();
      setFormData(prev => ({ ...prev, phone: '', description: '' })); // Reset specific fields
      setBooked(selectedProduct.name);
    } catch (error) {
      console.error(error);
      alert('Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const handleGalleryClick = (i) => {
    if (galleryItems[i]) setSelectedProduct(galleryItems[i].originalProductData);
  };

  // Form inline styles to match the OKOK TECH cinematic look
  const inputStyle = {
    width: '100%', padding: '10px', marginBottom: '10px',
    borderRadius: '4px', border: '1px solid #444',
    backgroundColor: '#1a1a1a', color: '#fff', outline: 'none'
  };

  return (
    <div className="pp-root">
      <div className="pp-bg-orb pp-bg-orb--a" />
      <div className="pp-bg-orb pp-bg-orb--b" />
      <div className="pp-bg-grid" />

      <header className="pp-header">
        <div className="pp-header-eyebrow">
          <span className="pp-live-dot" />
          {filtered.length} solutions available
        </div>
        <h1 className="pp-header-title">Our <span className="pp-gradient-text">Products</span></h1>
        <p className="pp-header-sub">Explore and instantly book world-class digital solutions crafted by OKOK TECH.</p>

        <div className="pp-controls">
          <div className={`pp-search-wrap${searchFocus ? ' pp-search-wrap--focus' : ''}`}>
            <span className="pp-search-icon">⌕</span>
            <input
              type="text" placeholder="Search products…" value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)}
              className="pp-search-input"
            />
            {search && <button className="pp-search-clear" onClick={() => setSearch('')}>×</button>}
          </div>
          <div className="pp-view-toggle">
            <button className={`pp-toggle-btn${view === 'gallery' ? ' pp-toggle-btn--active' : ''}`} onClick={() => setView('gallery')} title="Carousel">◫</button>
            <button className={`pp-toggle-btn${view === 'grid'    ? ' pp-toggle-btn--active' : ''}`} onClick={() => setView('grid')}    title="Grid">▦</button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="pp-loader"><div className="pp-spinner" /><span>Loading products…</span></div>
      ) : filtered.length === 0 ? (
        <div className="pp-empty"><span className="pp-empty-icon">🔍</span><p>No products match "<strong>{search}</strong>"</p></div>
      ) : view === 'gallery' ? (
        <div className="full-screen-gallery-wrapper">
          <CircularGallery items={galleryItems} bend={0.35} scrollSpeed={1.2} scrollEase={0.08} onItemClick={handleGalleryClick} />
        </div>
      ) : (
        <section className="pp-grid">
          {filtered.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} onClick={setSelectedProduct} />
          ))}
        </section>
      )}

      {selectedProduct && (
        <div className="pm-backdrop" onClick={closeProductModal}>
          <div className="pm-modal" onClick={e => e.stopPropagation()}>
            <div className="pm-accent-line" style={{ '--accent': getAccent(filtered.findIndex(p => p.id === selectedProduct.id)) }} />
            <button className="pm-close" onClick={closeProductModal}>×</button>
            <div className="pm-img-wrap">
              <img src={selectedProduct.imageUrl || `https://picsum.photos/seed/${selectedProduct.id}/600/400`} alt={selectedProduct.name} className="pm-img" />
              <div className="pm-img-badge">OKOK TECH</div>
            </div>
            <div className="pm-body">
              <span className="pm-eyebrow">Digital Solution</span>
              <h2 className="pm-title">{selectedProduct.name}</h2>
              
              {!showBookingForm ? (
                <>
                  <p className="pm-desc">{selectedProduct.desc || 'A premium digital solution crafted by OKOK TECH to elevate your operational efficiency.'}</p>
                  <div className="pm-pills">
                    {['Fast Delivery', 'Dedicated PM', 'Fixed Price', '24/7 Support'].map(f => (
                      <span key={f} className="pm-pill">{f}</span>
                    ))}
                  </div>
                  <button className="pm-book-btn" onClick={() => {
                    if (!currentUser) alert('Please login to book a product!');
                    else setShowBookingForm(true);
                  }}>
                    <span>Book this Product</span><span className="pm-btn-arrow">→</span>
                  </button>
                  <p className="pm-note">Free discovery call · No payment required now</p>
                </>
              ) : (
                <form onSubmit={handleBookSubmit} style={{ marginTop: '15px' }}>
                  <input 
                    type="text" name="clientName" value={formData.clientName} onChange={handleInputChange} 
                    required style={inputStyle} placeholder="Your Name" 
                  />
                  <input 
                    type="email" name="clientEmail" value={formData.clientEmail} onChange={handleInputChange} 
                    required style={inputStyle} placeholder="Your Email" 
                  />
                  <input 
                    type="tel" name="phone" value={formData.phone} onChange={handleInputChange} 
                    required style={inputStyle} placeholder="Phone Number (+91...)" 
                  />
                  <textarea 
                    name="description" value={formData.description} onChange={handleInputChange} 
                    required style={{...inputStyle, minHeight: '80px', resize: 'vertical'}} placeholder="Brief description of what you want..." 
                  />
                  <button type="submit" className="pm-book-btn" disabled={booking} style={{ marginTop: '10px' }}>
                    {booking ? <span className="pm-btn-spinner" /> : <><span>Confirm Booking</span><span className="pm-btn-arrow">✓</span></>}
                  </button>
                  <button type="button" onClick={() => setShowBookingForm(false)} style={{ background: 'transparent', color: '#888', border: 'none', cursor: 'pointer', display: 'block', margin: '10px auto 0', fontSize: '14px' }}>
                    Cancel
                  </button>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

      {booked && <SuccessOverlay name={booked} onClose={() => setBooked(null)} />}
    </div>
  );
};

export default Products;