import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from "react-router-dom";

// Page Imports
import WelcomeScreen from './pages/welcome_pages/WelcomeScreen';
import HomePage from './HomePage';
import ResultPage from './ResultPage';
import Registration from './pages/registration_pages/Registration';
import Login from './pages/login_pages/Login';
import RepoLink from "./components/RepoLink";
import ComparePage from "./pages/ComparePage";
import ProfilePage from "./pages/ProfilePage";
import ViewReportPage from "./pages/ViewReportPage";

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
const LoginPageWrapper = () => {
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

const TeacherRoute = ({ children }) => {
  const stored = localStorage.getItem("current_user");
  if (!stored) return <Navigate to="/login" replace />;
  try {
    const user = JSON.parse(stored);
    if (user.role !== "teacher") return <Navigate to="/home" replace />;
  } catch {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Wrapper Component for Registration
const RegistrationPageWrapper = () => {
  const navigate = useNavigate();
  const handleBack = () => navigate("/");
  const handleLogin = () => navigate("/login");
  const handleRegistrationSuccess = () => navigate("/login");

  return (
    <Registration 
      onBack={handleBack}
      onLogin={handleLogin}
      onRegistrationSuccess={handleRegistrationSuccess}
    />
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing & Auth Routes */}
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPageWrapper />} />
        <Route path="/register" element={<RegistrationPageWrapper />} />
        
        {/* Main App Routes */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/result-page" element={<ResultPage />} />
        <Route path="/compare" element={<TeacherRoute><ComparePage /></TeacherRoute>} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/view-report" element={<ViewReportPage />} />
        
        {/* Component Test Route */}
        <Route path="/test-repo" element={<RepoLink />} />

        {/* Fallback route */}
        <Route path="*" element={<WelcomePage />} />
      </Routes>
    </Router>
  );
}

export default App;