import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { collection, getDocs } from 'firebase/firestore';
import Stack from './Stack'; // Importing our new Stack animation component
import './Testimonial.css';

const Testimonial = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatTestimonialDate = (dateValue) => {
    if (!dateValue) return "Recently"; 
    if (dateValue.seconds) {
      return new Date(dateValue.seconds * 1000).toLocaleDateString();
    }
    if (typeof dateValue === 'string') {
      return dateValue.split('T')[0];
    }
    return new Date(dateValue).toLocaleDateString();
  };

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "feedbacks"));
        const feedbackData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFeedbacks(feedbackData);
      } catch (error) {
        console.error("Error fetching feedbacks: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  const renderStars = (rating) => {
    const stars = [];
    const numRating = parseFloat(rating) || 5; 
    for (let i = 1; i <= 5; i++) {
      if (i <= numRating) {
        stars.push(<span key={i} className="star filled">★</span>);
      } else {
        stars.push(<span key={i} className="star empty">★</span>);
      }
    }
    return stars;
  };

  // Convert Firebase data into an array of JSX elements for the Stack
  const testimonialCards = feedbacks.map((item) => (
    <div className="testimonial-stack-card" key={item.id}>
      <div className="testimonial-stars">
        {renderStars(item.stars)}
      </div>
      <p className="testimonial-review">"{item.review}"</p>
      <div className="testimonial-footer">
        <h4 className="testimonial-client-name">{item.clientName}</h4>
        {item.createdAt && (
          <span className="testimonial-date">
            <p>{formatTestimonialDate(item.createdAt)}</p>
          </span>
        )}
      </div>
    </div>
  ));

  return (
    <section className="testimonials-section">
      <div className="testimonials-container">
        <h2 className="testimonials-title">What Our Clients Say</h2>
        <div className="testimonials-divider"></div>
        <p className="testimonials-subtitle">Read real feedback from people we've worked with.</p>
        
        {loading ? (
          <div className="loading-spinner">Loading reviews...</div>
        ) : (
          <div className="stack-wrapper">
            {feedbacks.length > 0 ? (
              <Stack
                randomRotation={true}
                sensitivity={200}
                sendToBackOnClick={true}
                cards={testimonialCards}
                autoplay={true}
                // Slower delay so users can read the text before it swipes!
                autoplayDelay={1500} 
                pauseOnHover={true}
              />
            ) : (
              <p className="no-reviews-msg">No testimonials available yet.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonial;