import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";

<<<<<<< HEAD
// Page Imports
import WelcomeScreen from './pages/welcome_pages/WelcomeScreen';
import HomePage from './HomePage';
import ResultPage from './ResultPage';
import Registration from './pages/registration_pages/Registration';
import Login from './pages/login_pages/Login';
import RepoLink from "./components/RepoLink"; // Added this back
=======
import HomePage from './HomePage';
import ResultPage from './ResultPage';
// import RepoLink from "./components/RepoLink";
>>>>>>> 9deace3 (modified app.jsx)

// Wrapper Component for Welcome
const WelcomePage = () => {
  const navigate = useNavigate();
  const handleLogin = () => navigate('/login');
  const handleContinueWithoutLogin = () => navigate('/home');

  return (
    <WelcomeScreen 
      onLogin={handleLogin}
      onContinueWithoutLogin={handleContinueWithoutLogin}
    />
  );
};

// Wrapper Component for Login
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

// Wrapper Component for Registration
const RegistrationPage = () => {
  const navigate = useNavigate();
  const handleBack = () => navigate("/");
  const handleLogin = () => navigate("/login");
  const handleRegisterSuccess = () => navigate("/login");

  return (
    <Registration 
      onBack={handleBack}
      onLogin={handleLogin}
      onRegisterSuccess={handleRegisterSuccess}
    />
  );
};

// Main App Component
function App() {
<<<<<<< HEAD
  return (
    <Router>
      <Routes>
        {/* Landing & Auth Routes */}
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        
        {/* Main App Routes */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/result-page" element={<ResultPage />} />
        
        {/* Component Test Route */}
        <Route path="/test-repo" element={<RepoLink />} />
      </Routes>
    </Router>
  );
=======
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage/>} />
                <Route path="/result-page" element={<ResultPage/>} />
                {/* <Route path="/" element={<RepoLink/>} /> */}
            </Routes>
        </Router>
    )
>>>>>>> 9deace3 (modified app.jsx)
}

export default App;