import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verificationEmail, setVerificationEmail] = useState('');

  const api = axios.create({
    baseURL: 'http://localhost:8000/api/auth',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const fetchUserDetails = useCallback(async (token) => {
    try {
      const response = await api.get('/get-user-data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser({ ...response.data, token });
      return response.data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      logout();
      return null;
    } finally {
      setLoading(false);
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
      const response = await api.post('/login', JSON.stringify(credentials));
      const { access_token } = response.data;
      localStorage.setItem('accessToken', access_token);
      const userData = await fetchUserDetails(access_token);
      return {
        success: !!userData,
        statusCode: response.status
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        statusCode: error.response ? error.response.status : 500
      };
    }
  };

  const register = async (credentials) => {
    try {
      const response = await api.post('/register', JSON.stringify(credentials));
      setVerificationEmail(credentials.email);

      return {
        statusCode: response.status,
        statusMessage: response.message
      }
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const verifyEmail = async (verificationData) => {
    console.log(verificationData)
    try {
      const response = await api.post('/verify-verification-code', JSON.stringify(verificationData));
      const { access_token } = response.data;
      localStorage.setItem('accessToken', access_token);
      const userData = await fetchUserDetails(access_token);
      setVerificationEmail('');
      return !!userData;
    } catch (error) {
      console.error('Email verification error:', error);
      return false;
    }
  };

  const updateUserData = async (userData) => {
    try {
      const response = await api.put('/update-user', userData, {
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

  const forgotPassword = async (email) => {
    try {
      const response = await api.post('/forgot-password', JSON.stringify(email));
      console.log(response)
      return {
        statusCode: response.status,
        statusMessage: response.message
      }
    } catch (error) {
      console.error('Error sending verification code for forgot password:', error);
    }
  }

  const updatePassword = async (password) => {
    try {
      const response = await api.post('/update-password', JSON.stringify(password), {
        headers: { Authorization: `Bearer ${user.token}`}
      })

      return {
        statusCode: response.status,
        statusMessage: response.message
      }

    } catch (error) {
      console.error('Error updating password:', error)
    }
  }


  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    setUser(null);
    setVerificationEmail('');
  }, []);

  const value = {
    user,
    login,
    register,
    verifyEmail,
    logout,
    loading,
    verificationEmail,
    updateUserData,
    refreshUserData: fetchUserDetails,
    updatePassword,
    forgotPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);