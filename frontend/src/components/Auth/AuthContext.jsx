import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserDetails = useCallback(async (token) => {
    try {
      const response = await axios.get('http://localhost:8000/get-user-data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = { ...response.data, token };
      setUser(userData);
      setLoading(false);
      return userData;
    } catch (error) {
      console.error('Error fetching user details:', error);
      logout();
      setLoading(false);
      return null;
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      console.log('AuthContext: Signing in with token', token);
      fetchUserDetails(token);
    } else {
      setLoading(false);
    }
  }, [fetchUserDetails]);

  const login = async (credentials) => {
    try {
      const formData = new FormData();
      Object.entries(credentials).forEach(([key, value]) => {
        formData.append(key, value);
      });
      const response = await axios.post('http://localhost:8000/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const { access_token } = response.data;
      localStorage.setItem('accessToken', access_token);

      const userData = await fetchUserDetails(access_token);
      return !!userData;

    } catch (error) {
      console.error('Login error:', error);
      if (error.response && error.response.status === 401) {
        throw new Error("Incorrect username or password");
      } else {
        throw new Error("An unexpected error occurred. Please try again later.");
      }
    }
  };

  const signup = async (userData) => {
    try {
      const formData = new FormData();
      Object.entries(userData).forEach(([key, value]) => {
        formData.append(key, value);
      });
      const response = await axios.post('http://localhost:8000/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const { access_token } = response.data;
      localStorage.setItem('accessToken', access_token);

      const fetchedUserData = await fetchUserDetails(access_token);
      return !!fetchedUserData;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  const updateUserData = async (userData) => {
    try {
      const response = await axios.put('http://localhost:8000/update-user', userData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const updatedUserData = response.data.username;

      setUser(prevUser => ({
        ...prevUser,
        ...updatedUserData
      }));

      return updatedUserData;
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  };


  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    setUser(null);
  }, []);

  const value = {
    user,
    login,
    signup,
    logout,
    loading,
    refreshUserData: fetchUserDetails,
    updateUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);