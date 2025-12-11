import React, { useState } from "react";
import { Eye, EyeOff, Lock, Mail, User, AlertCircle, CheckCircle } from "lucide-react";
import "./Registration.css";

const Registration = ({ onBack, onLogin, onRegistrationSuccess }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError("");
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        return emailRegex.test(email);
    };

    const validatePassword = (password) => {
        if(password.length < 6) {
            return "Password must be at least 6 characters long";
        }
        if(!/[A-Z]/.test(password)) {
            return "Password must contain an uppercase letter";
        }
        if(!/[a-z]/.test(password)) {
            return "Password must contain a lowercase letter";
        }
        if(!/[0-9]/.test(password)) {
            return "Password must contain a number";
        }
        return null;
    };

    const handleRegister = () => {
        setLoading(true);
        setError("");
        setSuccessMessage("");

        if(!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
            setError("All fields are required.");
            setLoading(false);
            return;
        }

        if(!validateEmail(formData.email)) {
            setError("Invalid email address.");
            setLoading(false);
            return;
        }

        const passError = validatePassword(formData.password);
        if(passError) {
            setError(passError);
            setLoading(false);
            return;
        }

        if(formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        setTimeout(() => {
            const mockUsers = [
                { email: "john.doe@gmail.com", firstName: "John", lastName: "Doe" },
                { email: "demo@devlens.com", firstName: "Demo", lastName: "User" },
            ];

            const exists = mockUsers.find((u) => u.email === formData.email);

            if(exists) {
                setError("This email is already registered.");
                setLoading(false);
                return;
            }

            setSuccessMessage("Registration successful!");
            setLoading(false);

            setTimeout(() => {
                alert("Please check your mail to verify your account.");
                onRegistrationSuccess();
            }, 2000);
        }, 1500);
    };

    const handleKeyPress = (e) => {
        if(e.key === "Enter") {
            handleRegister();
        }
    };

    return (
        <div className="registration-container">
            <div className="registration-card">
                <div className="registration-header">
                    <div className="registration-icon">
                        <User className="icon-user" />
                    </div>
                    <h2>Create Your Account</h2>
                    <p>Join DevLens to store your analysis history</p>
                </div>

                {error && (
                    <div className="error-message">
                        <AlertCircle className="error-icon" />
                        <p>{error}</p>
                    </div>
                )}

                {successMessage && (
                    <div className="success-message">
                        <CheckCircle className="success-icon" />
                        <p>{successMessage}</p>
                    </div>
                )}

                <div className="registration-form">
                    <div className="form-row">
                        <div className="form-group form-group-half">
                            <label>First Name *</label>
                            <div className="input-wrapper">
                                <User className="input-icon" />
                                <input
                                 type="text"
                                 name="firstName"
                                 value={formData.firstName}
                                 onChange={handleInputChange}
                                 onKeyPress={handleKeyPress}
                                 placeholder="Enter first name"
                                />
                            </div>
                        </div>

                        <div className="form-group form-group-half">
                            <label>Last Name *</label>
                            <div className="input-wrapper">
                                <User className="input-icon" />
                                <input
                                 type="text"
                                 name="lastName"
                                 value={formData.lastName}
                                 onChange={handleInputChange}
                                 onKeyPress={handleKeyPress}
                                 placeholder="Enter last name"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email *</label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" />
                            <input
                             type="email"
                             name="email"
                             value={formData.email}
                             onChange={handleInputChange}
                             onKeyPress={handleKeyPress}
                             placeholder="example@gmail.com"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password *</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" />
                            <input
                             type={showPassword ? "text" : "password"}
                             name="password"
                             value={formData.password}
                             onChange={handleInputChange}
                             onKeyPress={handleKeyPress}
                             placeholder="Create password"
                            />
                            <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff /> : <Eye />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Confirm Password *</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" />
                            <input
                             type={showConfirmPassword ? "text" : "password"}
                             name="confirmPassword"
                             value={formData.confirmPassword}
                             onChange={handleInputChange}
                             onKeyPress={handleKeyPress}
                             placeholder="Re-enter password"
                            />
                            <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                {showConfirmPassword ? <EyeOff /> : <Eye />}
                            </button>
                        </div>
                    </div>

                    <button className="btn btn-register" disabled={loading} onClick={handleRegister}>
                        {loading ? "Creating account..." : "Create Account"}
                    </button>
                </div>

                <div className="registration-footer">
                    <p>
                        Already have an account?{" "}
                        <button onClick={onLogin} className="link-button">
                            Log in
                        </button>
                    </p>
                </div>

                <div className="back-button-wrapper">
                    <button onClick={onBack} className="back-button">
                        Back to home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Registration;
