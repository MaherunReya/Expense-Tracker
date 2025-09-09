import React, { useState, useEffect } from 'react';
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
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const navigate = useNavigate(); 

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

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
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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
    <div className="login-page">
      {/* Header */}
      <header className="login-header">
        <div className="header-container">
          <div className="logo">
            <h2>
              <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                Midoru
              </Link>
            </h2>
          </div>
          <nav className="header-nav">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
            <button className="theme-toggle-btn" onClick={toggleTheme}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
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
                <span>⚠️ {error}</span>
              </div>
            )}
            
            <form onSubmit={handleSignup} className="signup-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <div className="input-container">
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
                <div className="input-container">
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
                <div className="input-container">
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
                  <div className="input-container">
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
                  <div className="password-toggle-container">
                    <input
                      type="checkbox"
                      id="showPassword"
                      checked={showPassword}
                      onChange={togglePasswordVisibility}
                      disabled={isLoading}
                    />
                    <label htmlFor="showPassword" className="password-toggle-label">
                      Show Password
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-input-container">
                  <div className="input-container">
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
                  <div className="password-toggle-container">
                    <input
                      type="checkbox"
                      id="showConfirmPassword"
                      checked={showConfirmPassword}
                      onChange={toggleConfirmPasswordVisibility}
                      disabled={isLoading}
                    />
                    <label htmlFor="showConfirmPassword" className="password-toggle-label">
                      Show Password
                    </label>
                  </div>
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
                Google
              </button>
              <button type="button" className="social-btn github-btn" disabled={isLoading}>
                GitHub
              </button>
            </div>
            
            <div className="login-link">
              <p>Already have an account? <Link to="/login">Log in now</Link></p>
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