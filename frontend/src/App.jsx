import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";

import WelcomeScreen from './pages/welcome_pages/WelcomeScreen';
import HomePage from './HomePage';
import ResultPage from './ResultPage';

// Welcome Page Wrapper
const WelcomePage = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    // Navigate to home page after login (you can add LoginScreen route later)
    navigate('/home');
  };

  const handleContinueWithoutLogin = () => {
    // Navigate to home page without login
    navigate('/home');
  };

  return (
    <WelcomeScreen 
      onLogin={handleLogin}
      onContinueWithoutLogin={handleContinueWithoutLogin}
    />
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        {/* <Route path="/home" element={<HomePage />} />
        <Route path="/result-page" element={<ResultPage />} /> */}
      </Routes>
    </Router>
  );
}

export default App;