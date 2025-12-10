import React, { use, useState } from "react";
import { Eye, EyeOff, Lock, Mail, User, AlertCircle, CheckCircle} from 'lucide-react';
import './Registration.css';

const Registration = ({ onBack, onLogin, onRegistrationSuccess}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email : '',
        password : '',
        confirmPassword : ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessmessage] = useState('');

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password) => {
        if(password.length < 6) {
            return 'Password must be at least 6 characters long';
        }
        if(!/[A-Z]/.test(password)) {
            return 'Password must contain at least one uppercase letter';
        }
        if(!/[a-z]/.test(password)) {
            return 'Password must contain at least one lowercase letter';
        }
        if(!/[0-9]/.test(password)) {
            return 'Password must contain at least one number';
        }
        return null;
    };

    
}