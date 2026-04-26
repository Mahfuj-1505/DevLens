import React, { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Mail, ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
import { api } from "../api";
import "./Registration.css";

const OTPVerification = ({ email, purpose = "registration", onBack, onSuccess, onResend }) => {
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleVerify = async () => {
        if (!otp.trim() || otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP");
            return;
        }

        if (purpose === "reset-password") {
            if (!newPassword.trim()) {
                setError("Please enter a new password");
                return;
            }
            if (!confirmPassword.trim()) {
                setError("Please confirm your new password");
                return;
            }
            if (newPassword !== confirmPassword) {
                setError("Passwords do not match");
                return;
            }
        }

        setLoading(true);
        setError("");
        setSuccessMessage("");

        try {
            if (purpose === "registration") {
                // For registration, just verify OTP
                const response = await fetch(`${api.baseURL}/auth/verify-otp`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email,
                        otp: otp.trim(),
                        purpose
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.detail || "Verification failed");
                }

                setSuccessMessage(data.message);
                setTimeout(() => {
                    onSuccess();
                }, 1500);
            } else if (purpose === "reset-password") {
                // For password reset, first verify OTP, then reset password
                // Step 1: Verify OTP
                const verifyResponse = await fetch(`${api.baseURL}/auth/verify-otp`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email,
                        otp: otp.trim(),
                        purpose
                    }),
                });

                const verifyData = await verifyResponse.json();

                if (!verifyResponse.ok) {
                    throw new Error(verifyData.detail || "OTP verification failed");
                }

                // Step 2: Reset password
                const resetResponse = await fetch(`${api.baseURL}/auth/reset-password`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email,
                        new_password: newPassword,
                        confirm_password: confirmPassword
                    }),
                });

                const resetData = await resetResponse.json();

                if (!resetResponse.ok) {
                    throw new Error(resetData.detail || "Password reset failed");
                }

                setSuccessMessage("Password reset successfully!");
                setTimeout(() => {
                    onSuccess();
                }, 1500);
            }
        } catch (err) {
            setError(err.message || "Verification failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResendLoading(true);
        setError("");

        try {
            const response = await fetch(`${api.baseURL}/auth/send-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    purpose
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Failed to resend OTP");
            }

            setCountdown(60);
            setSuccessMessage("OTP resent successfully!");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            setError(err.message || "Failed to resend OTP. Please try again.");
        } finally {
            setResendLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") handleVerify();
    };

    return (
        <div className="registration-container">
            <div className="registration-card">
                <div className="registration-header">
                    <div className="registration-icon">
                        <Mail className="icon-mail" />
                    </div>
                    <h2>Verify Your Email</h2>
                    <p>Enter the 6-digit code sent to {email}</p>
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
                        <label>OTP Code *</label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" />
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                                    setOtp(value);
                                }}
                                onKeyPress={handleKeyPress}
                                placeholder="Enter 6-digit OTP"
                                maxLength={6}
                            />
                        </div>
                        <p className="field-hint">Enter the code sent to your email</p>
                    </div>

                    {purpose === "reset-password" && (
                        <>
                            <div className="form-group">
                                <label>New Password *</label>
                                <div className="input-wrapper">
                                    <Lock className="input-icon" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Enter new password"
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff /> : <Eye />}
                                    </button>
                                </div>
                                <p className="field-hint">Choose a strong password</p>
                            </div>

                            <div className="form-group">
                                <label>Confirm New Password *</label>
                                <div className="input-wrapper">
                                    <Lock className="input-icon" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Confirm new password"
                                    />
                                </div>
                                <p className="field-hint">Re-enter your new password</p>
                            </div>
                        </>
                    )}

                    <button
                        className="btn btn-register"
                        disabled={loading || otp.length !== 6 || (purpose === "reset-password" && (!newPassword.trim() || !confirmPassword.trim()))}
                        onClick={handleVerify}
                    >
                        {loading ? "Verifying..." : purpose === "registration" ? "Verify OTP" : "Reset Password"}
                    </button>

                    <div className="otp-actions">
                        <button
                            type="button"
                            className="btn-link"
                            onClick={onBack}
                        >
                            <ArrowLeft size={16} />
                            Back
                        </button>

                        <button
                            type="button"
                            className="btn-link"
                            disabled={resendLoading || countdown > 0}
                            onClick={handleResend}
                        >
                            {resendLoading ? "Resending..." : countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OTPVerification;