import React, { useState, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { collection, query, where, getDocs, addDoc } from "firebase/firestore"; 
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"; 
import { db, auth, googleProvider } from '../firebase'; 
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser'; 
import './LoginorSignUp.css';

const LoginorSignUp = () => {
  const [activeTab, setActiveTab] = useState("login"); 
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  
  const { setUserName, setRole } = useContext(UserContext); 
  const navigate = useNavigate();

  const ADMIN_EMAIL = "okoktech.services@gmail.com";
  const ADMIN_PASSWORD = "31-03-2026#1";

  // --- EMAILJS CONFIGURATION ---
  const EMAILJS_SERVICE_ID = "service_kp5atct"; 
  const EMAILJS_TEMPLATE_ID = "template_80066jm"; 
  const EMAILJS_PUBLIC_KEY = "t78SV-h6vMv9eGL33"; 

  // STRICT DEBUGGING VERSION
const sendWelcomeEmail = async (clientName, clientEmail) => {
    // These keys MUST exactly match the {{variable_names}} in your EmailJS template
    const templateParams = {
      name: clientName,        
      to_email: clientEmail,   
    };

    // This will print to your browser console so you can verify the data is there
    console.log("DEBUG: Handing this data to EmailJS ->", templateParams);

    try {
      console.log("Attempting to send EmailJS request...");
      const response = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
      console.log('SUCCESS!', response.status, response.text);
      return true;
    } catch (err) {
      console.error('FAILED...', err);
      alert(`EmailJS Failed: ${err.text || err.message || JSON.stringify(err)}`);
      return false;
    }
  };

  const validateEmail = (emailStr) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(emailStr).toLowerCase());
  };

  const validatePhone = (phoneStr) => {
    const re = /^\+?[0-9]{10,15}$/;
    return re.test(String(phoneStr));
  };

  const validatePassword = (passwordStr) => {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(passwordStr);
  };

  const handleAuth = async () => {
    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    if (!validateEmail(email) && email !== ADMIN_EMAIL) {
      alert("Please enter a valid email address (e.g., user@example.com).");
      return;
    }

    if (activeTab === "login") {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        setUserName("Admin"); 
        setRole("admin");
        alert("Welcome back, Admin!");
        navigate('/admin');
        return; 
      }

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const q = query(collection(db, "quoteRequests"), where("clientEmail", "==", email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setUserName(userData.clientName); 
        } else {
          setUserName(user.email.split('@')[0]); 
        }

        setRole("user"); 
        alert("Login successful!");
        navigate('/dashboard'); 

      } catch (e) {
        console.error("Login Error: ", e);
        if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
            alert("Invalid email or password. Please try again.");
        } else {
            alert("An error occurred during login: " + e.message);
        }
      }
    } else {
      
      if (!name || !phone) {
        alert("Please fill in your full name and phone number to sign up.");
        return;
      }

      if (!validatePhone(phone)) {
        alert("Please enter a valid phone number (10-15 digits). Include country code if necessary.");
        return;
      }

      if (!validatePassword(password)) {
        alert("Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character (e.g., @, $, !, %).");
        return;
      }

      if (email === ADMIN_EMAIL) {
        alert("You cannot create an account with the administrator email.");
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await addDoc(collection(db, "quoteRequests"), {
          clientName: name,
          clientEmail: email,
          clientPhone: phone,
          clientPassword: password, 
          status: "New",
          timestamp: new Date(),
          authProvider: "email"
        });
        
        setUserName(name); 
        setRole("user"); 
        
        // AWAITing the email ensures it finishes sending before navigating away
        await sendWelcomeEmail(name, email);

        alert("Account created successfully!");
        navigate('/dashboard'); 
      } catch (e) {
        console.error("Sign Up Error: ", e);
        if (e.code === 'auth/email-already-in-use') {
            alert("An account with this email already exists.");
        } else {
            alert("Sign up failed: " + e.message);
        }
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;      
      
      const assignedRole = user.email === ADMIN_EMAIL ? "admin" : "user";
      
      if (assignedRole === "admin") {
        setUserName("Admin");
        setRole("admin");
        navigate('/admin');
        return;
      }

      const q = query(collection(db, "quoteRequests"), where("clientEmail", "==", user.email));
      const querySnapshot = await getDocs(q);

      let finalUserName = user.displayName || user.email.split('@')[0];

      if (querySnapshot.empty) {
        await addDoc(collection(db, "quoteRequests"), {
          clientName: finalUserName,
          clientEmail: user.email,
          clientPhone: user.phoneNumber || "Not Provided",
          status: "New",
          timestamp: new Date(),
          authProvider: "google"
        });

        // AWAITing the email ensures it finishes sending before navigating away
        await sendWelcomeEmail(finalUserName, user.email);
        
        alert("Google Account linked and created successfully!");
      } else {
        const existingData = querySnapshot.docs[0].data();
        if (existingData.clientName) {
            finalUserName = existingData.clientName;
        }
      }
      
      setUserName(finalUserName); 
      setRole(assignedRole);
      navigate('/dashboard');
      
    } catch (error) {
      console.error("Google Auth Error: ", error);
      alert("Failed to sign in with Google.");
    }
  };

  return (
    <div className='login_paper'>
        <div className="auth-tabs">
          <button 
            className={`auth-tab ${activeTab === "login" ? "active" : ""}`} 
            onClick={() => setActiveTab("login")}
          >
            Log In
          </button>
          <button 
            className={`auth-tab ${activeTab === "signup" ? "active" : ""}`} 
            onClick={() => setActiveTab("signup")}
          >
            Sign Up
          </button>
        </div>

        {activeTab === "signup" && (
          <>
            <input className='login-input' type="text" placeholder='Full Name' value={name} onChange={(e) => setName(e.target.value)} />
            <input className='login-input' type="number" placeholder='Phone Number (+91...)' value={phone} onChange={(e) => setPhone(e.target.value)} />
          </>
        )}
        
        <input className='login-input' type="email" placeholder='Email Address' value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className='login-input' type="password" placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)} />
        
        <button className='login-button' onClick={handleAuth}>
          {activeTab === "login" ? 'Log In' : 'Create Account'}
        </button>

        <div className="divider">OR</div>

        <button className="google-btn" onClick={handleGoogleLogin}>
          <svg className="google-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>
    </div>
  )
}

export default LoginorSignUp;