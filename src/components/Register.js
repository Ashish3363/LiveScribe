import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

import vex from 'vex-js';
import 'vex-js/dist/css/vex.css';
import 'vex-js/dist/css/vex-theme-default.css';


const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("http://localhost:5000/api/users/register", { name, email, password })

            vex.dialog.alert({
                message: "Registration successful! Redirecting to login...",
                callback: () => navigate("/") // Redirect after clicking OK
            });
        } catch (err) {
            //alert("Registration failed. " + (err.response?.data?.message || "Please try again."));
            vex.dialog.alert("Registration failed. " + (err.response?.data?.message || "Please try again."));
        }
    };

    return (
        <div>
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">Register</button>
            </form>

            {/* Login Link */}
            <p className="auth-switch">
                Already have an account? <Link to="/">Login</Link>
            </p>
        </div>
    );
};

export default Register;
