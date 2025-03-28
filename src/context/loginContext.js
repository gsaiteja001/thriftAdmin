import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const LoginContext = createContext();

export const LoginProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('username') || null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || null;
  });

  const [sellerInfo, setSellerInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [sellerInfoFetched, setSellerInfoFetched] = useState(false);

  // Save login state, username, and token to localStorage
  useEffect(() => {
    localStorage.setItem('isLoggedIn', isLoggedIn);
    if (username) localStorage.setItem('username', username);
    if (token) localStorage.setItem('token', token);
  }, [isLoggedIn, username, token]);

  // Fetch seller info when logged in
  useEffect(() => {
    const fetchSellerInfo = async () => {
      if (isLoggedIn && username && token && !sellerInfoFetched) {
        setLoading(true);
        try {
          const response = await axios.get('http://localhost:8080/api/sellers/info', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            params: {
              username,
            },
          });
          setSellerInfo(response.data);
          setError(null);
        } catch (err) {
          console.error('Failed to fetch seller info:', err);
          setError('Failed to fetch seller information.');
          setSellerInfo(null);
        } finally {
          setSellerInfoFetched(true)
          setLoading(false);
        }
      } else {
        setSellerInfo(null);
      }
    };

    fetchSellerInfo();
  }, [isLoggedIn, username, token]);

  return (
    <LoginContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        username,
        setUsername,
        token,
        setToken,
        sellerInfo,
        loading,
        error,
      }}
    >
      {children}
    </LoginContext.Provider>
  );
};
