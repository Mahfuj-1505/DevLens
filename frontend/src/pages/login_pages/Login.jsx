import React, { useState } from "react";
import { Eye, EyeOff, Lock, Mail, AlertCircle} from 'lucide-react';
import './Login.css';

const Login = ({ onBack, onRegister, onLoginSuccess, onForgotPassword}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const validateEmail = (email) => {
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    };

    const handleLogin = () => {
        setLoading(true);
        setError('');

        if(!formdata.email || !formdata.password) {
            setError('Please fill in all fields');
            setLoading(false);
            return;
        }

        if(!validateEmail(formdata.email)) {
            setError('Please enter a valid email address');
            setLoading(false);
            return;
        }

        setTimeout(() => {
            const mockUsers = [
                {
                    email: 'john.doe@email.com',
                    password: 'Demo123',
                    firstName: 'John',
                    lastName: 'Doe',
                    verified: true
                },
                {
                    email: 'demo@devlens.com',
                    password: 'demo123',
                    firstName: 'Demo',
                    lastName: 'User',
                    verified: true
                }
            ];

            const user = mockUsers.find(
                u => u.email === formdata.email && u.password === formdata.password
            );

            if(user) {
                if(!user.verified) {
                    setError('Please verify your email adress before logging in');
                    setLoading(false);
                    return;
                }

                const userData = {
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    token: 'mock-jwt-token-' + Date.now()
                };

                onLoginSuccess(userData);
            } else {
                setError('Invalid email or password');
            }

            setLoading(false);
        }, 1000);
    };

    const handleKeyPress = (e) => {
        if(e.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-icon">
                        <Lock className="icon-lock" />
                    </div>
                    <h2 className="login-title">Welcome Back</h2>
                    <p className="login-subtitle">Log in to access your DevLens account</p>
                </div>

                {error && (
                <div className="error-message">
                    <AlertCircle className="error-icon" />
                    <p className="error-text">{error}</p>
                </div>
                )}

                <div className="login-form">
                    <div className="form-group">
                        <label className="form-label">
                            Email Address <span className="required">*</span>
                        </label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" />
                            <input
                             type="email"
                             name="email"
                             value={formData.email}
                             onChange={handleInputChange}
                             onKeyPress={handleKeyPress}
                             className="form-input"
                             placeholder="example@gmail.com"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Password <span className="required">*</span>
                        </label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" />
                            <input
                             type={showPassword ? 'text' : 'password'}
                             name="password"
                             value={formData.password}
                             onChange={handleInputChange}
                             onKeyPress={handleKeyPress}
                             className="form-input"
                             placeholder="Enter your password"
                            />
                            <button
                             type="button"
                             onClick={() => setShowPassword(!showPassword)}
                             className="password-toggle"
                            >
                                {showPassword ? <EyeOff className="toggle-icon" /> : <Eye className="toggle-icon" />}
                            </button>
                        </div>
                    </div>

                    {onForgotPassword && (
                        <div className="forgot-password-wrapper">
                            <button
                             onClick={onForgotPassword}
                             className="forgot-password-link"
                            >
                                Forgot password?
                            </button>
                        </div>
                    )}

                    <button
                     onClick={handleLogin}
                     disabled={loading}
                     className="btn-login"
                    >
                        {loading ? 'Logging in...' : 'Log in'}
                    </button>
                </div>

                <div className="login-footer">
                    <p className="footer-text">
                        Don't have an account?{' '}
                    <button
                     onClick={onRegister}
                     className="link-button"
                    >
                        Sign up
                    </button>
                    </p>
                </div>

                <div className="back-button-wrapper">
                    <button
                     onClick={onBack}
                     className="back-button"
                    >
                        Back to home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;