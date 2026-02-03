import React, { useState} from "react";
import { useNavigate, useParams } from "react-router-dom";

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if(password !== confirmPassword) {
            alert("Password doesn't match");
            return;
        }

        console.log("Resetting password")
    }
}
