import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { gsap } from 'gsap';
import { motion } from 'framer-motion';
import './Projects.css';

// --- FRAMER MOTION TEXT ROLL COMPONENT ---
const STAGGER = 0.035;
const TextRoll = ({ children, className, center = false }) => {
  if (!children) return null;
  return (
    <span className={`text-roll-container ${className || ''}`} style={{ lineHeight: 0.9 }}>
      <div>
        {children.split("").map((l, i) => {
          const delay = center ? STAGGER * Math.abs(i - (children.length - 1) / 2) : STAGGER * i;
          return (
            <motion.span
              variants={{ initial: { y: 0 }, hovered: { y: "-100%" } }}
              transition={{ ease: "easeInOut", delay, duration: 0.3 }}
              className="text-roll-char"
              key={i}
            >
              {l === " " ? "\u00A0" : l}
            </motion.span>
          );
        })}
      </div>
      <div className="text-roll-layer-absolute">
        {children.split("").map((l, i) => {
          const delay = center ? STAGGER * Math.abs(i - (children.length - 1) / 2) : STAGGER * i;
          return (
            <motion.span
              variants={{ initial: { y: "100%" }, hovered: { y: 0 } }}
              transition={{ ease: "easeInOut", delay, duration: 0.3 }}
              className="text-roll-char"
              key={i}
            >
              {l === " " ? "\u00A0" : l}
            </motion.span>
          );
        })}
      </div>
    </span>
  );
};

// --- MAIN PROJECTS COMPONENT ---
const Projects = ({ enableHover = true }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const containerRef = useRef(null);

  // Fetch Projects from Firebase
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const projectList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjects(projectList);
      } catch (error) {
        console.error("Error fetching projects: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Dynamically calculate fan transforms based on total projects
  const getBaseTransform = (index, total) => {
    const mid = (total - 1) / 2;
    const offset = index - mid;
    const translateX = offset * 85; // 85px spread per card
    const rotate = offset * 5;      // 5deg rotation per card
    return `rotate(${rotate}deg) translate(${translateX}px)`;
  };

  // Prevent scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = selectedProject ? 'hidden' : 'unset';
  }, [selectedProject]);

  // --- GSAP ANIMATIONS ---
  useEffect(() => {
    if (projects.length === 0 || !containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.bounce-card',
        { scale: 0 },
        {
          scale: 1,
          stagger: 0.06,
          ease: 'elastic.out(1, 0.8)',
          delay: 0.2
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [projects.length]);

  const getNoRotationTransform = (transformStr) => {
    const hasRotate = /rotate\([\s\S]*?\)/.test(transformStr);
    if (hasRotate) {
      return transformStr.replace(/rotate\([\s\S]*?\)/, 'rotate(0deg)');
    } else if (transformStr === 'none') {
      return 'rotate(0deg)';
    } else {
      return `${transformStr} rotate(0deg)`;
    }
  };

  const getPushedTransform = (baseTransform, offsetX) => {
    const translateRegex = /translate\(([-0-9.]+)px\)/;
    const match = baseTransform.match(translateRegex);
    if (match) {
      const currentX = parseFloat(match[1]);
      const newX = currentX + offsetX;
      return baseTransform.replace(translateRegex, `translate(${newX}px)`);
    } else {
      return baseTransform === 'none' ? `translate(${offsetX}px)` : `${baseTransform} translate(${offsetX}px)`;
    }
  };

  const pushSiblings = (hoveredIdx) => {
    if (!enableHover || !containerRef.current) return;
    const q = gsap.utils.selector(containerRef);

    projects.forEach((_, i) => {
      const target = q(`.card-${i}`);
      gsap.killTweensOf(target);

      const baseTransform = getBaseTransform(i, projects.length);

      if (i === hoveredIdx) {
        const noRotationTransform = getNoRotationTransform(baseTransform);
        // Slightly lift the hovered card along with removing rotation
        const liftTransform = `${noRotationTransform} translateY(-30px) scale(1.05)`;
        gsap.to(target, {
          transform: liftTransform,
          zIndex: 50,
          duration: 0.4,
          ease: 'back.out(1.4)',
          overwrite: 'auto'
        });
      } else {
        const offsetX = i < hoveredIdx ? -180 : 180; // Push amount
        const pushedTransform = getPushedTransform(baseTransform, offsetX);
        const distance = Math.abs(hoveredIdx - i);
        const delay = distance * 0.05;

        gsap.to(target, {
          transform: pushedTransform,
          zIndex: i,
          duration: 0.4,
          ease: 'back.out(1.4)',
          delay,
          overwrite: 'auto'
        });
      }
    });
  };

  const resetSiblings = () => {
    if (!enableHover || !containerRef.current) return;
    const q = gsap.utils.selector(containerRef);

    projects.forEach((_, i) => {
      const target = q(`.card-${i}`);
      gsap.killTweensOf(target);
      const baseTransform = getBaseTransform(i, projects.length);
      
      gsap.to(target, {
        transform: baseTransform,
        zIndex: i,
        duration: 0.4,
        ease: 'back.out(1.4)',
        overwrite: 'auto'
      });
    });
  };

  return (
    <div className="projects-page-container">
      <div className="projects-header">
        <h2>Our Latest Projects</h2>
        <div className="projects-divider"></div>
        <p>Explore the high-performance digital solutions built by OKOK TECH.</p>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Gathering projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="no-projects">
          <p>No projects have been uploaded yet.</p>
        </div>
      ) : (
        /* BounceCards GSAP Container */
        <div className="bounceCardsContainer" ref={containerRef}>
          {projects.map((project, idx) => (
            <motion.div
              key={project.id}
              className={`bounce-card card-${idx}`}
              style={{
                transform: getBaseTransform(idx, projects.length),
                zIndex: idx
              }}
              onMouseEnter={() => pushSiblings(idx)}
              onMouseLeave={resetSiblings}
              onClick={() => setSelectedProject(project)}
              initial="initial"
              whileHover="hovered"
            >
              <div className="project-image-container">
                {project.imageUrl ? (
                  <img src={project.imageUrl} alt={project.title} className="project-image" />
                ) : (
                  <div className="project-image-placeholder">OKOK TECH</div>
                )}
                <div className="project-overlay">
                  <span className="view-project-btn">View Details</span>
                </div>
              </div>
              
              <div className="project-content">
                <h3 className="project-title-wrapper">
                  <TextRoll className="project-title" center={false}>
                    {project.title}
                  </TextRoll>
                </h3>
                <p className="project-description-preview">{project.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* --- DETAIL MODAL --- */}
      {selectedProject && (
        <div className="modal-backdrop" onClick={() => setSelectedProject(null)}>
          <div className="project-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setSelectedProject(null)}>&times;</button>
            <div className="modal-image-section">
              {selectedProject.imageUrl ? (
                <img src={selectedProject.imageUrl} alt={selectedProject.title} />
              ) : (
                <div className="modal-placeholder">OKOK TECH</div>
              )}
            </div>
            <div className="modal-details">
              <h2>{selectedProject.title}</h2>
              <div className="modal-tech-stack">
                <strong>Technologies Used:</strong>
                <div className="tech-tags">
                  {selectedProject.techStack ? selectedProject.techStack.split(',').map((tech, i) => (
                    <span key={i} className="tech-tag">{tech.trim()}</span>
                  )) : <span>Not specified</span>}
                </div>
              </div>
              <div className="modal-description">
                <strong>Project Overview:</strong>
                <p>{selectedProject.description}</p>
              </div>
              
              {/* Only show the actions div if a projectLink was provided by the admin */}
              {selectedProject.projectLink && (
                <div className="modal-actions">
                  <a 
                    href={selectedProject.projectLink.startsWith('http') ? selectedProject.projectLink : `https://${selectedProject.projectLink}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inquire-btn"
                    style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}
                  >
                    View Live Project ↗
                  </a>
                </div>
              )}
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;