import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";
import { jwtDecode } from 'jwt-decode';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem("token"); 
    localStorage.removeItem("user");
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      delete axios.defaults.headers.common['Authorization'];

      const res = await axios.post("http://localhost:8000/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;

      const decoded = jwtDecode(res.data.token);
      console.log("Decoded token:", decoded);

      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page">
      {/* Header */}
      <header className="login-header">
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
      <main className="login-main">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header-section">
              <h1>Welcome Back</h1>
              <p>Sign in to continue your financial journey</p>
            </div>
            
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-container">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
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
              
              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" disabled={isLoading} />
                  <span>Remember me</span>
                </label>
                <a href="/forgot-password" className="forgot-password">
                  Forgot password?
                </a>
              </div>
              
              <button 
                type="submit" 
                className="login-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
            
            <div className="login-divider">
              <span>Or continue with</span>
            </div>
            
            <div className="social-login">
              <button type="button" className="social-btn google-btn" disabled={isLoading}>
                <span className="social-icon">🔍</span>
                Google
              </button>
              <button type="button" className="social-btn github-btn" disabled={isLoading}>
                <span className="social-icon">💻</span>
                GitHub
              </button>
            </div>
            
            <div className="signup-link">
              <p>Don't have an account? <Link to="/signup">Sign up now</Link></p>
            </div>
          </div>
          
          <div className="login-hero">
            <div className="hero-content">
              <h2>Take Control of Your Financial Journey</h2>
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
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="login-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>Midoru</h3>
              <p>Your personal financial management solution</p>
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

export default Login;