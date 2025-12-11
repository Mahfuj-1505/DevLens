import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";

import WelcomeScreen from './pages/welcome_pages/WelcomeScreen';
import HomePage from './HomePage';
import ResultPage from './ResultPage';
import Registration from './pages/registration_pages/Registration';

const WelcomePage = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/register');
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

const RegistrationPage = () => {
  const navigate = useNavigate();
  
  const handleBack = () => navigate("/");
  const handleLogin = () => navigate("/");
  const handleRegistrationSuccess = () => navigate("/home");

  return(
    <Registration onBack={handleBack}
      onLogin={handleLogin}
      onRegistrationSuccess={handleRegistrationSuccess}
    />
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/register" element={<RegistrationPage />} />
        {/* <Route path="/home" element={<HomePage />} />
        <Route path="/result-page" element={<ResultPage />} /> */}
      </Routes>
    </Router>
  );
}

export default App;