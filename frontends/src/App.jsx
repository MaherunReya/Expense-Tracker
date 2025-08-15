import { useState } from 'react';
import { FaWallet, FaExchangeAlt, FaChartPie, FaBell, FaCog, FaSearch, FaArrowUp, FaDollarSign, FaShoppingBag } from 'react-icons/fa';
import './App.css';
const Homepage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Toggle this for auth state
  const [user, setUser] = useState({ name: 'Alex' }); // Sample user data

  return (
    <div className={`app-container ${isLoggedIn ? 'logged-in' : 'public'}`}>
      {isLoggedIn ? (
        <AuthenticatedView user={user} />
      ) : (
        <PublicView onLogin={() => setIsLoggedIn(true)} />
      )}
    </div>
  );
};

// Public Landing Page Component
const PublicView = ({ onLogin }) => (
  <div className="public-view">
    <header className="public-header">
      <div className="logo">
        <FaWallet className="wallet-icon" />
        <h1>ExpenseTrac</h1>
      </div>
      <nav>
        <ul>
          <li><a href="#features">Features</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li>
            <button className="login-btn" onClick={onLogin}>
              Login
            </button>
          </li>
        </ul>
      </nav>
    </header>

    <main className="hero-section">
      <div className="hero-content">
        <h2>Take Control of Your Finances</h2>
        <p>Smart expense tracking for a healthier financial life</p>
        <div className="cta-buttons">
          <button className="primary-btn">Get Started</button>
          <button className="secondary-btn">Learn More</button>
        </div>
      </div>
      <div className="hero-image">
        <img 
          src="https://via.placeholder.com/600x400/81C784/FFFFFF?text=ExpenseTrac+Dashboard" 
          alt="Dashboard Preview" 
        />
      </div>
    </main>
  </div>
);

// Authenticated Dashboard Component
const AuthenticatedView = ({ user }) => (
  <div className="dashboard-container">
    {/* Sidebar Navigation */}
    <aside className="sidebar">
      <div className="logo">
        <FaWallet className="wallet-icon" />
        <h1>ExpenseTrac</h1>
      </div>
      <nav>
        <ul>
          <li className="active">
            <a href="#">
              <FaWallet className="nav-icon" /> Dashboard
            </a>
          </li>
          <li>
            <a href="#">
              <FaExchangeAlt className="nav-icon" /> Transactions
            </a>
          </li>
          <li>
            <a href="#">
              <FaChartPie className="nav-icon" /> Reports
            </a>
          </li>
          <li>
            <a href="#">
              <FaBell className="nav-icon" /> Alerts
            </a>
          </li>
          <li>
            <a href="#">
              <FaCog className="nav-icon" /> Settings
            </a>
          </li>
        </ul>
      </nav>
    </aside>

    {/* Main Content Area */}
    <div className="main-content">
      <header className="dashboard-header">
        <div className="user-greeting">
          <h3>Welcome back, <span>{user.name}</span>!</h3>
          <p>Here's your financial overview</p>
        </div>
        <div className="user-actions">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input type="text" placeholder="Search transactions..." />
          </div>
          <div className="user-profile">
            <div className="notification-badge">
              <FaBell />
              <span className="badge">3</span>
            </div>
            <img 
              src="https://via.placeholder.com/40/4CAF50/FFFFFF?text=AU" 
              alt="User Profile" 
            />
          </div>
        </div>
      </header>

      {/* Dashboard Widgets */}
      <div className="dashboard-widgets">
        {/* Balance Summary */}
        <div className="widget balance-card">
          <h3>Total Balance</h3>
          <h2>$12,345.67</h2>
          <div className="trend up">
            <FaArrowUp /> 1.5% vs last month
          </div>
        </div>

        {/* Income vs Expenses */}
        <div className="widget chart-card">
          <h3>Income vs Expenses</h3>
          <div className="chart-placeholder">
            {/* Chart would be rendered here */}
            <div className="mock-chart">
              <div className="income-bar" style={{ height: '70%' }}></div>
              <div className="expense-bar" style={{ height: '30%' }}></div>
            </div>
          </div>
          <div className="chart-legend">
            <span className="income-legend">
              <div className="legend-color income"></div>
              Income
            </span>
            <span className="expense-legend">
              <div className="legend-color expense"></div>
              Expenses
            </span>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="widget transactions-card">
          <h3>Recent Transactions</h3>
          <ul className="transactions-list">
            <li>
              <div className="transaction-icon income">
                <FaDollarSign />
              </div>
              <div className="transaction-details">
                <p className="transaction-title">Freelance Payment</p>
                <p className="transaction-time">Today, 10:45 AM</p>
              </div>
              <div className="transaction-amount income">+$1,200</div>
            </li>
            <li>
              <div className="transaction-icon expense">
                <FaShoppingBag />
              </div>
              <div className="transaction-details">
                <p className="transaction-title">Grocery Store</p>
                <p className="transaction-time">Yesterday, 5:30 PM</p>
              </div>
              <div className="transaction-amount expense">-$86.75</div>
            </li>
          </ul>
          <a href="#" className="view-all-link">View All Transactions →</a>
        </div>
      </div>
    </div>
  </div>
);

export default Homepage;