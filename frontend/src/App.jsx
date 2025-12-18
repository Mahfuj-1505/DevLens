import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";

import WelcomeScreen from './pages/welcome_pages/WelcomeScreen';
import HomePage from './HomePage';
import ResultPage from './ResultPage';
import Registration from './pages/registration_pages/Registration';
import Login from './pages/login_pages/Login';

const WelcomePage = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleContinueWithoutLogin = () => {
    navigate('/home');
  };

  return (
    <WelcomeScreen 
      onLogin={handleLogin}
      onContinueWithoutLogin={handleContinueWithoutLogin}
    />
  );
};

const LoginPage = () => {
  const navigate = useNavigate();

  const handleBack = () => navigate("/");
  const handleRegister = () => navigate("/register");
  const handleLoginSuccess = (userData) => {
    console.log('Login successful:', userData);
    navigate("/home");
  };
  const handleForgotPassword = () => navigate("/forgot-password");

  return (
    <Login
      onBack={handleBack}
      onRegister={handleRegister}
      onLoginSuccess={handleLoginSuccess}
      onForgotPassword={handleForgotPassword}
    />
  );
};

const RegistrationPage = () => {
  const navigate = useNavigate();
  
  const handleBack = () => navigate("/");
  const handleLogin = () => navigate("/login");
  const handleRegisterSuccess = () => {
    navigate("/login");
  };

  return (
    <Registration 
      onBack={handleBack}
      onLogin={handleLogin}
      onRegisterSuccess={handleRegisterSuccess}
    />
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/result-page" element={<ResultPage />} />
      </Routes>
    </Router>
  );
}

export default App;