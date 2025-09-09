import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import { jwtDecode } from 'jwt-decode';
import './Signup.css';

const Signup = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate(); 

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }
    setError("");

    try {
      const res = await fetch('http://localhost:8000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age, email, password })
      });

      const responseText = await res.text();
      
      if (!res.ok) {
        setError(`Signup failed: ${responseText}`);
        setIsLoading(false);
        return;
      }

      // Try to parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        setError('Invalid server response');
        setIsLoading(false);
        return;
      }
      
      console.log('Signup successful:', data);
      if (data.token) {
        // Clear any existing auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Store new auth data
        localStorage.setItem('token', data.token);

        const decoded = jwtDecode(data.token);
        localStorage.setItem('user', JSON.stringify(decoded));
      }

      navigate('/dashboard');

    } catch (err) {
      setError('Signup failed: ' + err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-page">
      {/* Header */}
      <header className="signup-header">
        <div className="header-container">
          <div className="logo">
            <Link to="/">
              <h2>Midoru</h2>
            </Link>
          </div>
          <nav className="header-nav">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="signup-main">
        <div className="signup-container">
          <div className="signup-card">
            <div className="signup-header-section">
              <h1>Create Your Account</h1>
              <p>Join thousands who have transformed their financial lives</p>
            </div>
            
            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSignup} className="signup-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <div className="input-icon">
                  <i className="fas fa-user"></i>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="age">Age</label>
                <div className="input-icon">
                  <i className="fas fa-birthday-cake"></i>
                  <input
                    id="age"
                    type="number"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Your age"
                    min="13"
                    max="120"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-icon">
                  <i className="fas fa-envelope"></i>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-container">
                  <div className="input-icon">
                    <i className="fas fa-lock"></i>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      disabled={isLoading}
                    />
                  </div>
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={togglePasswordVisibility}
                    disabled={isLoading}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-input-container">
                  <div className="input-icon">
                    <i className="fas fa-lock"></i>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      disabled={isLoading}
                    />
                  </div>
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={toggleConfirmPasswordVisibility}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              
              <div className="form-options">
                <label className="terms-agreement">
                  <input type="checkbox" required disabled={isLoading} />
                  <span>I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></span>
                </label>
              </div>
              
              <button 
                type="submit" 
                className="signup-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
            
            <div className="signup-divider">
              <span>Or sign up with</span>
            </div>
            
            <div className="social-signup">
              <button type="button" className="social-btn google-btn" disabled={isLoading}>
                <span className="social-icon">🔍</span>
                Google
              </button>
              <button type="button" className="social-btn github-btn" disabled={isLoading}>
                <span className="social-icon">💻</span>
                GitHub
              </button>
            </div>
            
            <div className="login-link">
              <p>Already have an account? <Link to="/login">Log in now</Link></p>
            </div>
          </div>
          
          <div className="signup-hero">
            <div className="hero-content">
              <h2>Start Your Financial Journey</h2>
              <p>Track expenses, manage budgets, and achieve your financial goals with Midoru</p>
              <div className="hero-features">
                <div className="feature">
                  <span className="feature-icon">💰</span>
                  <span>Expense Tracking</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">📊</span>
                  <span>Budget Management</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">📅</span>
                  <span>Bill Reminders</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">📈</span>
                  <span>Financial Reports</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="signup-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>Midoru</h3>
              <p>Your personal financial management solution for a better financial future.</p>
            </div>
            <div className="footer-section">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#testimonials">Testimonials</a>
            </div>
            <div className="footer-section">
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Blog</a>
              <a href="#">Contact</a>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Security</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Midoru. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Signup;