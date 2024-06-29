import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './components/Auth/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Navbar from './components/Home/Navbar';
import Auth from './components/Home/Auth';
import Hero from './components/Home/Hero';
import Dashboard from './components/Auth/Dashboard'
import { Toaster } from "./components/ui/toaster"

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<Hero />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
        </div>
      </Router>
      <Toaster />
    </AuthProvider>
  );
}

export default App;