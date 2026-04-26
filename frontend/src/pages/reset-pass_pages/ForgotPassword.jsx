import React, { useState } from "react";
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { api } from "../../api";
import OTPVerification from "../../components/OTPVerification";
import "./ResetPassScreen.css";

const ForgotPassword = ({ onBack }) => {
    const [email, setEmail] = useState("");
    const [showVerification, setShowVerification] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const validateEmail = (email) => {
        if (!email) return "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return "Please enter a valid email address";
        if (!email.endsWith("@iit.du.ac.bd")) return "Only @iit.du.ac.bd emails are allowed";
        return null;
    };

    const handleSendOTP = async () => {
        const emailError = validateEmail(email);
        if (emailError) {
            setError(emailError);
            return;
        }

        setLoading(true);
        setError("");
        setSuccessMessage("");

        try {
            const response = await fetch(`${api.baseURL}/auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Failed to send OTP");
            }

            setSuccessMessage(data.message);
            setTimeout(() => {
                setShowVerification(true);
                setSuccessMessage("");
            }, 1500);
        } catch (err) {
            setError(err.message || "Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerificationSuccess = () => {
        alert("Password reset successful! You can now log in with your new password.");
        onBack();
    };

    const handleBackToForgotPassword = () => {
        setShowVerification(false);
        setError("");
        setSuccessMessage("");
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") handleSendOTP();
    };

    if (showVerification) {
        return (
            <OTPVerification
                email={email}
                purpose="reset-password"
                onBack={handleBackToForgotPassword}
                onSuccess={handleVerificationSuccess}
            />
        );
    }

    return (
        <div className="registration-container">
            <div className="registration-card">
                <div className="registration-header">
                    <div className="registration-icon">
                        <Mail className="icon-mail" />
                    </div>
                    <h2>Reset Password</h2>
                    <p>Enter your email to receive a password reset code</p>
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
                    <div className="form-group">
                        <label>Email *</label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Enter your @iit.du.ac.bd email"
                            />
                        </div>
                        <p className="field-hint">Enter your registered email address</p>
                    </div>

                    <button
                        className="btn btn-register"
                        disabled={loading || !email.trim()}
                        onClick={handleSendOTP}
                    >
                        {loading ? "Sending..." : "Send Reset Code"}
                    </button>

                    <div className="form-footer">
                        <button
                            type="button"
                            className="btn-link"
                            onClick={onBack}
                        >
                            <ArrowLeft size={16} />
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;