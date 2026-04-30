import React, { createContext, useState, useEffect } from 'react';
import { auth } from '../firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  // Initialize from localStorage so Navbar/Admin panel see it instantly on refresh
  const [userName, setUserNameState] = useState(localStorage.getItem('userName') || "");
  const [role, setRoleState] = useState(localStorage.getItem('userRole') || "");
  const [loading, setLoading] = useState(true);

  const ADMIN_EMAIL = "okoktech.services@gmail.com"; 

  // Wrapper functions to update state AND localStorage simultaneously
  const setUserName = (name) => {
    setUserNameState(name);
    if (name) localStorage.setItem('userName', name);
    else localStorage.removeItem('userName');
  };

  const setRole = (newRole) => {
    setRoleState(newRole);
    if (newRole) localStorage.setItem('userRole', newRole);
    else localStorage.removeItem('userRole');
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        // Only overwrite role if not already manually set as admin
        if (localStorage.getItem('userRole') !== 'admin') {
          setUserName(user.displayName || user.email.split('@')[0]);
          const assignedRole = user.email === ADMIN_EMAIL ? "admin" : "user";
          setRole(assignedRole);
        }
      } else {
        // If Firebase says no user, but we have an admin override in localStorage, keep it
        if (localStorage.getItem('userRole') !== 'admin') {
          setCurrentUser(null);
          setUserName("");
          setRole("");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    } finally {
      setRole("");
      setUserName("");
      setCurrentUser(null);
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
    }
  };

  return (
    <UserContext.Provider value={{ 
      currentUser, 
      userName,
      setUserName, 
      role, 
      setRole,
      logout, 
      loading 
    }}>
      {children}
    </UserContext.Provider>
  );
};