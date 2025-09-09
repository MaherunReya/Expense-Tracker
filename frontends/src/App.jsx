import React, { useState, useEffect } from 'react';
import './App.css';

const Homepage = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const checkLoginStatus = () => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    checkLoginStatus();
    
    const interval = setInterval(checkLoginStatus, 1000);
    
    return () => clearInterval(interval);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="homepage">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">
            <h2>Midoru</h2>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#testimonials">Testimonials</a>
            <a href="#pricing">Pricing</a>
            {isLoggedIn ? (
              <>
                <a href="/dashboard" className="dashboard-btn">Dashboard</a>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </>
            ) : (
              <>
                <a href="/login" className="login-btn">Login</a>
                <a href="/signup" className="signup-btn">Sign Up</a>
              </>
            )}
            <button className="theme-toggle-btn" onClick={toggleTheme}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>
        
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span>Your Financial Freedom Starts Here</span>
            </div>
            <h1>
              <span className="text-gradient">Take Control</span> of Your 
              <span className="highlight"> Financial Journey</span>
            </h1>
            <p className="hero-description">
              Midoru helps you track expenses, manage budgets, and achieve your financial goals with ease. 
              Join thousands who have already transformed their financial lives.
            </p>
            <div className="hero-buttons">
              <a href="/signup" className="primary-btn">
                <span>Get Started Free</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a href="#demo" className="secondary-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 7L16 12L10 17V7Z" fill="currentColor"/>
                </svg>
                <span>Watch Demo</span>
              </a>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Active Users</div>
              </div>
              <div className="stat">
                <div className="stat-number">$25M+</div>
                <div className="stat-label">Managed</div>
              </div>
              <div className="stat">
                <div className="stat-number">4.9/5</div>
                <div className="stat-label">Rating</div>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="dashboard-showcase">
              <div className="showcase-header">
                <div className="showcase-controls">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="showcase-title">Monthly Overview</div>
              </div>
              <div className="showcase-content">
                <div className="showcase-chart">
                  <div className="chart-bar" style={{height: '40%'}}></div>
                  <div className="chart-bar" style={{height: '65%'}}></div>
                  <div className="chart-bar" style={{height: '80%'}}></div>
                  <div className="chart-bar" style={{height: '60%'}}></div>
                  <div className="chart-bar" style={{height: '45%'}}></div>
                  <div className="chart-bar" style={{height: '75%'}}></div>
                </div>
                <div className="showcase-stats">
                  <div className="stat-card">
                    <div className="stat-icon"></div>
                    <div className="stat-info">
                      <div className="stat-value">$3,240</div>
                      <div className="stat-label">Income</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-info">
                      <div className="stat-value">$1,480</div>
                      <div className="stat-label">Expenses</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="floating-card card-1">
              <div className="card-icon">✅</div>
              <div className="card-text">Budget on track</div>
            </div>
            <div className="floating-card card-2">
              <div className="card-icon">🎯</div>
              <div className="card-text">Goal achieved</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <h2>Powerful Features for Your Finances</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Expense Tracking</h3>
              <p>Easily track and categorize your expenses with intuitive visualizations.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Budget Management</h3>
              <p>Set budgets and receive alerts when you're approaching your limits.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Bill Reminders</h3>
              <p>Never miss a payment with smart bill reminders and tracking.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Financial Reports</h3>
              <p>Generate detailed reports to understand your spending patterns.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Debt Tracking</h3>
              <p>Monitor your debts and create payoff plans to become debt-free.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Secure & Private</h3>
              <p>Your financial data is encrypted and never shared with third parties.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2>How Midoru Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Sign Up</h3>
              <p>Create your account in less than a minute.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Connect Accounts</h3>
              <p>Securely link your bank accounts or add transactions manually.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Track & Analyze</h3>
              <p>Monitor your finances and get insights to improve your financial health.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="testimonials">
        <div className="container">
          <h2>What Our Users Say</h2>
          <div className="testimonial-cards">
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"Midoru helped me save over $5,000 in just six months by identifying unnecessary expenses I wasn't aware of."</p>
              </div>
              <div className="testimonial-author">
                <h4>Sarah Johnson</h4>
                <p>Freelance Designer</p>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"The bill reminder feature alone is worth it. I've never missed a payment since I started using Midoru."</p>
              </div>
              <div className="testimonial-author">
                <h4>Michael Chen</h4>
                <p>Software Engineer</p>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"As a small business owner, Midoru gives me clarity on both personal and business finances in one place."</p>
              </div>
              <div className="testimonial-author">
                <h4>Jessica Williams</h4>
                <p>Business Owner</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Ready to Transform Your Financial Life?</h2>
          <p>Join thousands of users who have already taken control of their finances with Midoru.</p>
          <a href="/signup" className="primary-btn large">Get Started for Free</a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
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

export default Homepage;