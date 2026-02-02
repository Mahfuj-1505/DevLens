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

    const [errors, setErrors] = useState({});
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const validateName = (name, fieldName) => {
        if (!name.trim()) return `${fieldName} is required`;
        if (!/^[A-Za-z\s]+$/.test(name))
            return `${fieldName} should contain only letters and spaces`;
        if (name.trim().length < 3)
            return `${fieldName} must be at least 3 characters long`;
        return null;
    };

    const validateEmail = (email) => {
        if (!email.trim()) return "Email is required";
        const emailRegex = /^[^\s@]+@iit\.du\.ac\.bd$/;
        if (!emailRegex.test(email))
            return "Email must be an @iit.du.ac.bd address";
        return null;
    };

    const validatePassword = (password) => {
        if (password.length < 8)
            return "Password must be at least 8 characters long";
        if (!/[A-Z]/.test(password))
            return "Password must contain an uppercase letter";
        if (!/[a-z]/.test(password))
            return "Password must contain a lowercase letter";
        if (!/[0-9]/.test(password))
            return "Password must contain a number";
        return null;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData({ ...formData, [name]: value });

        let fieldError = null;
        if (name === "firstName") fieldError = validateName(value, "First name");
        if (name === "lastName") fieldError = validateName(value, "Last name");
        if (name === "email") fieldError = validateEmail(value);
        if (name === "password") fieldError = validatePassword(value);
        if (name === "confirmPassword")
            fieldError = value !== formData.password ? "Passwords do not match" : null;

        setErrors({ ...errors, [name]: fieldError });
    };

    const handleRegister = () => {
        setLoading(true);
        setError("");
        setSuccessMessage("");

        const newErrors = {};

        newErrors.firstName = validateName(formData.firstName, "First name");
        newErrors.lastName = validateName(formData.lastName, "Last name");
        newErrors.email = validateEmail(formData.email);
        newErrors.password = validatePassword(formData.password);

        if (!formData.confirmPassword)
            newErrors.confirmPassword = "Please confirm your password";
        else if (formData.password !== formData.confirmPassword)
            newErrors.confirmPassword = "Passwords do not match";

        Object.keys(newErrors).forEach(
            (key) => newErrors[key] === null && delete newErrors[key]
        );

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setError("Please fix the errors below.");
            setLoading(false);
            return;
        }

        setTimeout(() => {
            setSuccessMessage("Registration successful!");
            setLoading(false);
            setTimeout(() => {
                alert("Please check your mail to verify your account.");
                onRegistrationSuccess();
            }, 2000);
        }, 1500);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") handleRegister();
    };

    const errorStyle = {
        color: "#ff4d6d",
        fontSize: "0.85rem",
        marginTop: "6px",
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
                                />
                            </div>
                            {errors.firstName && <p style={errorStyle}>{errors.firstName}</p>}
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
                                />
                            </div>
                            {errors.lastName && <p style={errorStyle}>{errors.lastName}</p>}
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
                            />
                        </div>
                        {errors.email && <p style={errorStyle}>{errors.email}</p>}
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
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff /> : <Eye />}
                            </button>
                        </div>
                        {errors.password && <p style={errorStyle}>{errors.password}</p>}
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
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                            >
                                {showConfirmPassword ? <EyeOff /> : <Eye />}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p style={errorStyle}>{errors.confirmPassword}</p>
                        )}
                    </div>

                    <button
                        className="btn btn-register"
                        disabled={loading}
                        onClick={handleRegister}
                    >
                        {loading ? "Creating account..." : "Create Account"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Registration;
