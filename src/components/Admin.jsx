import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Admin.css';

// The 7 Stages of the OKOK TECH Project Lifecycle
const PROJECT_STAGES = [
  'Requirement Analysis & Scope',
  'UI/UX Design & Prototyping',
  'Core Development & Architecture',
  'Client Review & Revisions',
  'Quality Assurance & Testing',
  'Final Deployment & Go-Live',
  'Handover & Post-Launch Support'
];

const Admin = () => {
  const { role, loading: authLoading } = useContext(UserContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');

  // Data States
  const [projects, setProjects]   = useState([]);
  const [users, setUsers]         = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [products, setProducts]   = useState([]);
  const [bookings, setBookings]   = useState([]);
  const [employees, setEmployees] = useState([]);
  const [homeStats, setHomeStats] = useState({ totalProjects: '', happyClients: '', satisfaction: '' });
  const [loading, setLoading]     = useState(true);

  // Search States
  const [searchProject,  setSearchProject]  = useState('');
  const [searchUser,     setSearchUser]     = useState('');
  const [searchFeedback, setSearchFeedback] = useState('');
  const [searchProduct,  setSearchProduct]  = useState('');
  const [searchBooking,  setSearchBooking]  = useState('');
  const [searchEmployee, setSearchEmployee] = useState('');

  // Form & Upload States
  const [formData,      setFormData]      = useState({});
  const [editingId,     setEditingId]     = useState(null);
  const [imageFile,     setImageFile]     = useState(null);
  const [uploading,     setUploading]     = useState(false);
  const [uploadStatus,  setUploadStatus]  = useState('');

  // Modal States
  const [initModalOpen,      setInitModalOpen]      = useState(false);
  const [lifecycleModalOpen, setLifecycleModalOpen] = useState(false);
  const [selectedBooking,    setSelectedBooking]    = useState(null);
  const [meetingDetails,     setMeetingDetails]     = useState({ link: '', date: '', time: '' });
  const [alertModal,         setAlertModal]         = useState({ show: false, title: '', message: '', variant: 'primary' });

  const showAlert = (title, message, variant = 'primary') =>
    setAlertModal({ show: true, title, message, variant });
  const closeAlert = () => setAlertModal(a => ({ ...a, show: false }));

  const resetForm = () => { setEditingId(null); setFormData({}); setImageFile(null); setUploadStatus(''); };

  useEffect(() => {
    if (role === 'admin') fetchAllData();
  }, [role]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [projSnap, userSnap, feedSnap, prodSnap, bookSnap, empSnap, statsDoc] = await Promise.all([
        getDocs(collection(db, 'projects')),
        getDocs(collection(db, 'quoteRequests')),
        getDocs(collection(db, 'feedbacks')),
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'bookings')),
        getDocs(collection(db, 'employees')),
        getDoc(doc(db, 'settings', 'homeStats')),
      ]);
      setProjects(projSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setUsers(userSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setFeedbacks(feedSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setBookings(bookSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setEmployees(empSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      if (statsDoc.exists()) setHomeStats(statsDoc.data());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const formatDate = (ts) => {
    if (!ts) return 'N/A';
    return new Date(ts.seconds ? ts.seconds * 1000 : ts).toLocaleString();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) { setImageFile(null); return; }
    if (!file.type.startsWith('image/')) {
      showAlert('Invalid File', 'Please select a valid image file.', 'danger');
      e.target.value = '';
      return;
    }
    setImageFile(file);
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    if (file.type === 'image/svg+xml') {
      const r = new FileReader();
      r.readAsDataURL(file);
      r.onload  = () => resolve(r.result);
      r.onerror = reject;
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (ev) => {
      const img = new Image();
      img.src = ev.target.result;
      img.onload = () => {
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > h ? w > MAX : h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else       { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const fmt = (file.type === 'image/png' || file.type === 'image/webp') ? 'image/webp' : 'image/jpeg';
        resolve(canvas.toDataURL(fmt, fmt === 'image/webp' ? 0.8 : 0.7));
      };
    };
    reader.onerror = reject;
  });

  const handleSave = async (collectionName) => {
    setUploading(true);
    setUploadStatus('Processing image...');
    try {
      let finalImageUrl = formData.imageUrl || '';
      if (imageFile) finalImageUrl = await fileToBase64(imageFile);

      setUploadStatus('Saving...');
      const dataToSave = { ...formData, imageUrl: finalImageUrl };

      if (editingId) {
        await updateDoc(doc(db, collectionName, editingId), dataToSave);
        showAlert('Success', 'Updated successfully!', 'success');
      } else {
        dataToSave.createdAt = new Date();
        await addDoc(collection(db, collectionName), dataToSave);
        showAlert('Success', 'Added successfully!', 'success');
      }

      resetForm();
      const fi = document.getElementById('file-upload-input');
      if (fi) fi.value = '';
      fetchAllData();
    } catch (e) {
      console.error(e);
      showAlert('Error', e.message.includes('exceeds') ? 'Image too large. Use smaller image or URL.' : 'Action failed: ' + e.message, 'danger');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (collectionName, id) => {
    if (window.confirm('Are you sure? This cannot be undone.')) {
      await deleteDoc(doc(db, collectionName, id));
      fetchAllData();
    }
  };

  const handleEdit = (item) => { setEditingId(item.id); setFormData(item); setImageFile(null); };

  const saveStats = async () => {
    await setDoc(doc(db, 'settings', 'homeStats'), homeStats);
    showAlert('Success', 'Home page stats updated!', 'success');
  };

  const updateBookingStatus = async (id, status) => {
    try {
      // When a project is accepted, automatically start it at stage 1
      const updateData = { status };
      if (status === 'Accepted') updateData.currentStage = 1;

      await updateDoc(doc(db, 'bookings', id), updateData);
      showAlert('Success', `Booking marked as ${status}!`, 'success');
      fetchAllData();
    } catch (e) { showAlert('Error', 'Failed to update status.', 'danger'); }
  };

  const updateProjectStage = async (stageIndex) => {
    if (!selectedBooking) return;
    try {
      await updateDoc(doc(db, 'bookings', selectedBooking.id), { currentStage: stageIndex });
      setSelectedBooking(prev => ({ ...prev, currentStage: stageIndex }));
      showAlert('Success', `Project advanced to Stage ${stageIndex}!`, 'success');
      fetchAllData();
    } catch (e) {
      showAlert('Error', 'Failed to update project stage.', 'danger');
    }
  };

  const handleSendInitialization = async () => {
    if (!meetingDetails.link || !meetingDetails.date || !meetingDetails.time) {
      showAlert('Missing Details', 'Please fill all meeting details.', 'warning');
      return;
    }
    const msg = `Hello! We are ready to initialize your project. Please join our meeting on ${meetingDetails.date} at ${meetingDetails.time}. Link: ${meetingDetails.link}`;
    try {
      await updateDoc(doc(db, 'bookings', selectedBooking.id), {
        status: 'Initialized', adminMessage: msg,
        meetingLink: meetingDetails.link, meetingDate: meetingDetails.date, meetingTime: meetingDetails.time,
      });
      showAlert('Success', 'Initialization message sent!', 'success');
      setInitModalOpen(false);
      setMeetingDetails({ link: '', date: '', time: '' });
      setSelectedBooking(null);
      fetchAllData();
    } catch (e) { showAlert('Error', 'Failed to initialize booking.', 'danger'); }
  };

  if (authLoading) return <div style={{ padding: '5rem', textAlign: 'center' }}>Verifying Admin Access...</div>;

  if (role !== 'admin') return (
    <div className="admin-container" style={{ padding: '5rem', textAlign: 'center' }}>
      <h2 style={{ color: '#ef4444' }}>Access Denied</h2>
      <p>You do not have permission to view this page.</p>
      <button className="admin-btn btn-primary" onClick={() => navigate('/home')}>Go Home</button>
    </div>
  );

  /* ── Sidebar nav items ── */
  const navItems = [
    { key: 'overview',   label: '📊 Live Stats'  },
    { key: 'projects',   label: '🗂 Projects'    },
    { key: 'products',   label: '📦 Products'    },
    { key: 'employees',  label: '👥 Team Members'},
    { key: 'bookings',   label: '📅 Bookings'    },
    { key: 'users',      label: '👤 Users'       },
    { key: 'feedbacks',  label: '💬 Feedbacks'   },
  ];

  /* ── Reusable image upload row ── */
  const ImageUploadRow = () => (
    <div style={{ width: '100%', display: 'flex', gap: '10px', alignItems: 'center', background: '#f3f4f6', padding: '10px', borderRadius: '8px' }}>
      <input type="text" placeholder="Paste Image URL  OR..." value={formData.imageUrl || ''} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} style={{ flex: 1 }} />
      <span style={{ fontWeight: 'bold', color: '#666' }}>OR</span>
      <input id="file-upload-input" type="file" accept="image/*, .svg" onChange={handleFileSelect} style={{ flex: 1 }} />
    </div>
  );

  /* ── Reusable save/cancel buttons ── */
  const FormActions = ({ collection: col }) => (
    <>
      {uploading && <div style={{ width: '100%', color: '#009dff', fontWeight: 'bold' }}>{uploadStatus}</div>}
      <button className="admin-btn btn-success" onClick={() => handleSave(col)} disabled={uploading}>
        {uploading ? 'Processing…' : editingId ? 'Update' : 'Add New'}
      </button>
      {editingId && <button className="admin-btn btn-secondary" onClick={resetForm}>Cancel</button>}
    </>
  );

  return (
    <div className="admin-dashboard-wrapper">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <h2>Admin Panel</h2>
        <ul className="admin-nav">
          {navItems.map(({ key, label }) => (
            <li key={key} className={activeTab === key ? 'active' : ''} onClick={() => { setActiveTab(key); resetForm(); }}>
              {label}
            </li>
          ))}
        </ul>
      </div>

      <div className="admin-main-content">

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div>
            <h2>Manage Home Page Stats</h2>
            <div className="form-row">
              <input type="text" value={homeStats.totalProjects || ''} onChange={e => setHomeStats({ ...homeStats, totalProjects: e.target.value })} placeholder="Total Projects" />
              <input type="text" value={homeStats.happyClients  || ''} onChange={e => setHomeStats({ ...homeStats, happyClients:  e.target.value })} placeholder="Happy Clients" />
              <input type="text" value={homeStats.satisfaction  || ''} onChange={e => setHomeStats({ ...homeStats, satisfaction:  e.target.value })} placeholder="Satisfaction %" />
              <button className="admin-btn btn-primary" onClick={saveStats}>Update Live Site</button>
            </div>
          </div>
        )}

        {/* ── PROJECTS ── */}
        {activeTab === 'projects' && (
          <div>
            <h2>{editingId ? 'Edit Project' : 'Manage Projects'}</h2>
            <div className="form-row" style={{ flexWrap: 'wrap', gap: '10px' }}>
              <input type="text" placeholder="Title" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              <input type="text" placeholder="Tech Stack" value={formData.techStack || ''} onChange={e => setFormData({ ...formData, techStack: e.target.value })} />
              
              {/* New input for Project Link */}
              <input type="url" placeholder="Project URL / Demo Link (Optional)" value={formData.projectLink || ''} onChange={e => setFormData({ ...formData, projectLink: e.target.value })} style={{ width: '100%' }} />
              
              <textarea placeholder="Description" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '10px' }} />
              <ImageUploadRow />
              <FormActions collection="projects" />
            </div>
            <input type="text" className="search-input" placeholder="Search Projects..." value={searchProject} onChange={e => setSearchProject(e.target.value)} />
            <div className="card-grid">
              {projects.filter(p => (p.title || '').toLowerCase().includes(searchProject.toLowerCase())).map(p => (
                <div className="data-card" key={p.id}>
                  {p.imageUrl && <img src={p.imageUrl} alt="Project" style={{ width: '100%', height: '120px', objectFit: 'contain', borderRadius: '8px', marginBottom: '10px' }} />}
                  <h3>{p.title}</h3>
                  <p><strong>Tech:</strong> {p.techStack}</p>
                  
                  {/* Display the link if it exists */}
                  {p.projectLink && (
                    <p><strong>Link:</strong> <a href={p.projectLink.startsWith('http') ? p.projectLink : `https://${p.projectLink}`} target="_blank" rel="noopener noreferrer" style={{color: '#007bff'}}>View Project</a></p>
                  )}
                  
                  <p><strong>Date:</strong> {formatDate(p.createdAt)}</p>
                  <div className="card-actions">
                    <button className="admin-btn btn-primary" onClick={() => handleEdit(p)}>Edit</button>
                    <button className="admin-btn btn-danger"  onClick={() => handleDelete('projects', p.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {activeTab === 'products' && (
          <div>
            <h2>{editingId ? 'Edit Product' : 'Manage Products'}</h2>
            <div className="form-row" style={{ flexWrap: 'wrap', gap: '10px' }}>
              <input type="text" placeholder="Product Name" value={formData.name  || ''} onChange={e => setFormData({ ...formData, name:  e.target.value })} />
              <input type="text" placeholder="Price"        value={formData.price || ''} onChange={e => setFormData({ ...formData, price: e.target.value })} />
              <textarea placeholder="Description" value={formData.desc || ''} onChange={e => setFormData({ ...formData, desc: e.target.value })} style={{ width: '100%', padding: '10px' }} />
              <ImageUploadRow />
              <FormActions collection="products" />
            </div>
            <input type="text" className="search-input" placeholder="Search Products..." value={searchProduct} onChange={e => setSearchProduct(e.target.value)} />
            <div className="card-grid">
              {products.filter(p => (p.name || '').toLowerCase().includes(searchProduct.toLowerCase())).map(p => (
                <div className="data-card" key={p.id}>
                  {p.imageUrl && <img src={p.imageUrl} alt="Product" style={{ width: '100%', height: '120px', objectFit: 'contain', borderRadius: '8px', marginBottom: '10px' }} />}
                  <h3>{p.name}</h3>
                  <p><strong>Price:</strong> {p.price}</p>
                  <div className="card-actions">
                    <button className="admin-btn btn-primary" onClick={() => handleEdit(p)}>Edit</button>
                    <button className="admin-btn btn-danger"  onClick={() => handleDelete('products', p.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── EMPLOYEES ── */}
        {activeTab === 'employees' && (
          <div>
            <h2>{editingId ? 'Edit Team Member' : 'Manage Team Members'}</h2>
            <div className="form-row" style={{ flexWrap: 'wrap', gap: '10px' }}>
              <input type="text" placeholder="Full Name"   value={formData.name       || ''} onChange={e => setFormData({ ...formData, name:       e.target.value })} />
              <input type="text" placeholder="Job Title"   value={formData.title      || ''} onChange={e => setFormData({ ...formData, title:      e.target.value })} />
              <input type="text" placeholder="Department"  value={formData.department || ''} onChange={e => setFormData({ ...formData, department: e.target.value })} />
              <input type="email" placeholder="Email"      value={formData.email      || ''} onChange={e => setFormData({ ...formData, email:      e.target.value })} />
              <input type="text" placeholder="LinkedIn URL" value={formData.linkedin  || ''} onChange={e => setFormData({ ...formData, linkedin:   e.target.value })} />
              <input type="text" placeholder="Twitter/X URL" value={formData.twitter  || ''} onChange={e => setFormData({ ...formData, twitter:    e.target.value })} />
              <input type="number" placeholder="Years of Experience" value={formData.experience || ''} onChange={e => setFormData({ ...formData, experience: e.target.value })} />
              <textarea
                placeholder="Short bio / about this person"
                value={formData.bio || ''}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                style={{ width: '100%', padding: '10px', minHeight: '80px' }}
              />
              <input
                type="text"
                placeholder="Skills (comma-separated: React, Node.js, Figma)"
                value={formData.skills || ''}
                onChange={e => setFormData({ ...formData, skills: e.target.value })}
                style={{ width: '100%' }}
              />
              <ImageUploadRow />
              <FormActions collection="employees" />
            </div>

            <input type="text" className="search-input" placeholder="Search Team Members..." value={searchEmployee} onChange={e => setSearchEmployee(e.target.value)} />
            <div className="card-grid">
              {employees
                .filter(e => (e.name || '').toLowerCase().includes(searchEmployee.toLowerCase()))
                .map(emp => (
                  <div className="data-card" key={emp.id}>
                    {emp.imageUrl
                      ? <img src={emp.imageUrl} alt={emp.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 10px', display: 'block', border: '3px solid #40c9a2' }} />
                      : <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg,#40c9a2,#80a4ed)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '1.8rem', color: '#fff' }}>
                          {(emp.name || '?')[0].toUpperCase()}
                        </div>
                    }
                    <h3 style={{ textAlign: 'center', marginBottom: '4px' }}>{emp.name}</h3>
                    <p style={{ textAlign: 'center', color: '#40c9a2', fontWeight: 600, marginBottom: '6px' }}>{emp.title}</p>
                    <p><strong>Dept:</strong> {emp.department}</p>
                    <p><strong>Exp:</strong> {emp.experience} yrs</p>
                    {emp.skills && <p><strong>Skills:</strong> {emp.skills}</p>}
                    <div className="card-actions">
                      <button className="admin-btn btn-primary" onClick={() => handleEdit(emp)}>Edit</button>
                      <button className="admin-btn btn-danger"  onClick={() => handleDelete('employees', emp.id)}>Delete</button>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* ── BOOKINGS ── */}
        {activeTab === 'bookings' && (
          <div>
            <h2>Manage Bookings</h2>
            <input type="text" className="search-input" placeholder="Search Bookings..." value={searchBooking} onChange={e => setSearchBooking(e.target.value)} />
            <div className="card-grid">
              {bookings.filter(b => (b.clientName || '').toLowerCase().includes(searchBooking.toLowerCase())).map(b => (
                <div className="data-card" key={b.id}>
                  <h3>{b.clientName}</h3>
                  <p><strong>Product:</strong> {b.product}</p>
                  <p><strong>Status:</strong> {b.status || 'Pending'}</p>
                  
                  {/* Show current stage if accepted */}
                  {b.status === 'Accepted' && (
                    <p><strong>Stage:</strong> {b.currentStage ? `${b.currentStage}/7 - ${PROJECT_STAGES[b.currentStage - 1]}` : '1/7 - Initializing'}</p>
                  )}

                  <div className="card-actions">
                    {(!b.status || b.status === 'Pending') && (
                      <button className="admin-btn btn-warning" onClick={() => { setSelectedBooking(b); setInitModalOpen(true); }}>Initialize</button>
                    )}
                    {b.status === 'Initialized' && (
                      <>
                        <button className="admin-btn btn-success" onClick={() => updateBookingStatus(b.id, 'Accepted')}>Accept</button>
                        <button className="admin-btn btn-danger"  onClick={() => updateBookingStatus(b.id, 'Rejected')}>Reject</button>
                      </>
                    )}
                    
                    {/* NEW BUTTON: Open Lifecycle Progress Manager */}
                    {b.status === 'Accepted' && (
                      <button className="admin-btn btn-info" onClick={() => { setSelectedBooking(b); setLifecycleModalOpen(true); }}>Manage Progress</button>
                    )}

                    <button className="admin-btn btn-danger" onClick={() => handleDelete('bookings', b.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {activeTab === 'users' && (
          <div>
            <h2>Registered Users (Quote Requests)</h2>
            <input type="text" className="search-input" placeholder="Search Users..." value={searchUser} onChange={e => setSearchUser(e.target.value)} />
            <div className="card-grid">
              {users.filter(u => (u.clientName || '').toLowerCase().includes(searchUser.toLowerCase())).map(u => (
                <div className="data-card" key={u.id}>
                  <h3>{u.clientName}</h3>
                  <p><strong>Email:</strong> {u.clientEmail}</p>
                  <p><strong>Phone:</strong> {u.clientPhone}</p>
                  <p><strong>Registered:</strong> {formatDate(u.timestamp)}</p>
                  <div className="card-actions">
                    <button className="admin-btn btn-danger" onClick={() => handleDelete('quoteRequests', u.id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FEEDBACKS ── */}
        {activeTab === 'feedbacks' && (
          <div>
            <h2>Client Feedbacks</h2>
            <input type="text" className="search-input" placeholder="Search Feedbacks..." value={searchFeedback} onChange={e => setSearchFeedback(e.target.value)} />
            <div className="card-grid">
              {feedbacks.filter(f => (f.name || '').toLowerCase().includes(searchFeedback.toLowerCase())).map(f => (
                <div className="data-card" key={f.id}>
                  <h3>{f.name}</h3>
                  <p>"{f.message}"</p>
                  <p><strong>Rating:</strong> {f.rating}/5</p>
                  <div className="card-actions">
                    <button className="admin-btn btn-danger" onClick={() => handleDelete('feedbacks', f.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Initialize booking */}
      <Modal show={initModalOpen} onHide={() => setInitModalOpen(false)} backdrop="static" keyboard={false}>
        <Modal.Header closeButton><Modal.Title>Initialize Project</Modal.Title></Modal.Header>
        <Modal.Body>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {['link', 'date', 'time'].map(field => (
              <input key={field} type={field === 'link' ? 'text' : field}
                placeholder={field === 'link' ? 'Meeting Link' : undefined}
                value={meetingDetails[field]}
                onChange={e => setMeetingDetails({ ...meetingDetails, [field]: e.target.value })}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
              />
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setInitModalOpen(false)}>Cancel</Button>
          <Button variant="success" onClick={handleSendInitialization}>Send</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal: 7-Stage Project Lifecycle Manager */}
      <Modal show={lifecycleModalOpen} onHide={() => setLifecycleModalOpen(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Update Project Lifecycle: {selectedBooking?.clientName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Select the current stage of development. This progress will be visible to the client on their dashboard.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PROJECT_STAGES.map((stageName, index) => {
              const stageNum = index + 1;
              const currentStage = selectedBooking?.currentStage || 1;
              const isCompleted = stageNum < currentStage;
              const isCurrent = stageNum === currentStage;

              return (
                <div 
                  key={stageNum} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '15px', 
                    borderRadius: '8px',
                    border: isCurrent ? '2px solid #007bff' : '1px solid #e0e0e0',
                    backgroundColor: isCompleted ? '#f0fdf4' : (isCurrent ? '#f8faff' : '#ffffff'),
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    width: '35px', height: '35px', borderRadius: '50%',
                    backgroundColor: isCompleted ? '#22c55e' : (isCurrent ? '#007bff' : '#cbd5e1'),
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold', marginRight: '15px'
                  }}>
                    {isCompleted ? '✓' : stageNum}
                  </div>
                  
                  <div style={{ flex: 1, fontSize: '1.1rem', fontWeight: isCurrent ? 'bold' : 'normal', color: isCompleted ? '#166534' : '#333' }}>
                    {stageName}
                  </div>
                  
                  <Button 
                    variant={isCompleted ? "outline-success" : (isCurrent ? "primary" : "outline-secondary")}
                    disabled={isCurrent}
                    onClick={() => updateProjectStage(stageNum)}
                  >
                    {isCurrent ? 'Current Stage' : 'Set as Current'}
                  </Button>
                </div>
              )
            })}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setLifecycleModalOpen(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal: Alert */}
      <Modal show={alertModal.show} onHide={closeAlert} backdrop="static" keyboard={false} centered>
        <Modal.Header closeButton className={`bg-${alertModal.variant} text-white`}>
          <Modal.Title>{alertModal.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{ fontSize: '1.1rem', margin: 0, padding: '1rem 0' }}>{alertModal.message}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant={alertModal.variant} onClick={closeAlert}>Understood</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Admin;