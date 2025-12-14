import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

import vex from 'vex-js';
import 'vex-js/dist/css/vex.css';
import 'vex-js/dist/css/vex-theme-default.css';

const Login = ({ setIsAuthenticated }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("http://localhost:5000/api/users/login", { email, password });
            localStorage.setItem("token", res.data.token);  // Store the token
            localStorage.setItem("userId", res.data.userId);  // Store the userId
            setIsAuthenticated(true);
            navigate("/dashboard"); // Redirect to Dashboard
        } catch (err) {
            vex.dialog.alert("Login failed. " + (err.response?.data?.message || "Please try again."));
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">Login</button>
            </form>

            {/* Register Link */}
            <p className="auth-switch">
                Don't have an account? <Link to="/register">Register</Link>
            </p>
        </div>
    );
};

export default Login;
