
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { jwtDecode } from 'jwt-decode';
import './Signup.css';

const Signup = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate(); 

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");

    try {
      const res = await fetch('http://localhost:8000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age, email, password })
      });

      if (!res.ok) {
        const errorText = await res.text();
        setError(`Signup failed: ${errorText}`);
        return;
      }

      const data = await res.json();
      console.log('Signup successful:', data);
      if (data.token) {
        localStorage.clear(); 
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        localStorage.setItem('token', data.token);

        const decoded = jwtDecode(data.token);
        localStorage.setItem('user', JSON.stringify(decoded));
      }

      navigate('/dashboard');

    } catch (err) {
      setError('Signup failed: ' + err.message);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <h2 className="signup-title">Sign Up</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSignup} className="signup-form">
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="age">Age:</label>
            <input
              id="age"
              type="number"
              required
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Your age"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Retype your password"
            />
          </div>
          <button type="submit" className="signup-button">Sign Up</button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
