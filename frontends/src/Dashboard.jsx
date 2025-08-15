import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './dashboard.css';
import { jwtDecode } from 'jwt-decode';
<<<<<<< HEAD
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
=======
>>>>>>> 921ba539bb809ca69a1c0efa4cd1a0ab5fe70ecd

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categorySummary, setCategorySummary] = useState({});
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [monthlySummary, setMonthlySummary] = useState({});
  const [yearlySummary, setYearlySummary] = useState({});
<<<<<<< HEAD
  const [activeChart, setActiveChart] = useState('bar');
  
  // Budget Alert System States
  const [budgets, setBudgets] = useState([]);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [budgetFormData, setBudgetFormData] = useState({
    category: '',
    monthlyLimit: '',
    alertThreshold: 80 // Alert when 80% of budget is reached
  });
  
=======
>>>>>>> 921ba539bb809ca69a1c0efa4cd1a0ab5fe70ecd
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'income',
    category: '',
    date: new Date().toISOString(),
  });
  const [editId, setEditId] = useState(null);

<<<<<<< HEAD
  // Predefined categories for better organization
  const predefinedCategories = [
    'Food & Dining',
    'Rent & Housing',
    'Transportation',
    'Entertainment',
    'Shopping',
    'Healthcare',
    'Utilities',
    'Education',
    'Travel',
    'Other'
  ];

=======
>>>>>>> 921ba539bb809ca69a1c0efa4cd1a0ab5fe70ecd
  const token = localStorage.getItem("token");
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const API_URL = 'http://localhost:8000';

<<<<<<< HEAD
  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        throw new Error('Token expired');
      }
      setUser(decoded);
      fetchTransactions();
      loadBudgets();
    } catch (error) {
      console.error('Authentication error:', error);
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }, [token]);

  // Load budgets from localStorage (you can later move this to backend)
  const loadBudgets = () => {
    const savedBudgets = localStorage.getItem(`budgets_${user?.userId || 'default'}`);
    if (savedBudgets) {
      setBudgets(JSON.parse(savedBudgets));
    }
  };

  // Save budgets to localStorage
  const saveBudgets = (newBudgets) => {
    setBudgets(newBudgets);
    localStorage.setItem(`budgets_${user?.userId || 'default'}`, JSON.stringify(newBudgets));
  };

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const res = await axios.get(`${API_URL}/transactions`, config);
      const data = res.data;

      setTransactions(data);

      const summary = calculateCategorySummary(data);
      setCategorySummary(summary);

      let income = 0;
      let expense = 0;
      data.forEach(txn => {
        if (txn.type === 'income') income += Number(txn.amount);
        else if (txn.type === 'expense') expense += Number(txn.amount);
      });
      setTotalIncome(income);
      setTotalExpense(expense);

      setMonthlySummary(getMonthlySummary(data));
      setYearlySummary(getYearlySummary(data));
      
      // Check for budget alerts after loading transactions
      checkBudgetAlerts(data);
    } catch (error) {
      console.error('Error fetching transactions:', error.response?.data || error.message);
    }
  };

  // Budget Alert Logic
  const checkBudgetAlerts = (transactionData = transactions) => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const alerts = [];

    budgets.forEach(budget => {
      const monthlySpending = getMonthlySpendingByCategory(transactionData, budget.category, currentMonth);
      const spendingPercentage = (monthlySpending / budget.monthlyLimit) * 100;
      
      if (spendingPercentage >= budget.alertThreshold) {
        alerts.push({
          category: budget.category,
          spent: monthlySpending,
          limit: budget.monthlyLimit,
          percentage: spendingPercentage.toFixed(1),
          type: spendingPercentage >= 100 ? 'over' : 'warning'
        });
      }
    });

    setBudgetAlerts(alerts);
  };

  const getMonthlySpendingByCategory = (transactionData, category, month) => {
    return transactionData
      .filter(txn => {
        const txnMonth = new Date(txn.date).toISOString().slice(0, 7);
        return txn.type === 'expense' && 
               txn.category === category && 
               txnMonth === month;
      })
      .reduce((sum, txn) => sum + Number(txn.amount), 0);
  };

  // Budget Form Handlers
  const handleBudgetSubmit = (e) => {
    e.preventDefault();
    
    if (!budgetFormData.category || !budgetFormData.monthlyLimit) {
      alert('Please fill in all required fields');
      return;
    }

    const newBudget = {
      id: Date.now().toString(),
      category: budgetFormData.category,
      monthlyLimit: Number(budgetFormData.monthlyLimit),
      alertThreshold: Number(budgetFormData.alertThreshold),
      createdAt: new Date().toISOString()
    };

    // Check if budget for this category already exists
    const existingBudgetIndex = budgets.findIndex(b => b.category === budgetFormData.category);
    let updatedBudgets;

    if (existingBudgetIndex >= 0) {
      updatedBudgets = [...budgets];
      updatedBudgets[existingBudgetIndex] = newBudget;
    } else {
      updatedBudgets = [...budgets, newBudget];
    }

    saveBudgets(updatedBudgets);
    setBudgetFormData({ category: '', monthlyLimit: '', alertThreshold: 80 });
    setShowBudgetForm(false);
    
    // Recheck alerts with updated budgets
    setTimeout(() => checkBudgetAlerts(), 100);
  };

  const deleteBudget = (budgetId) => {
    const updatedBudgets = budgets.filter(b => b.id !== budgetId);
    saveBudgets(updatedBudgets);
    checkBudgetAlerts();
  };
=======

useEffect(() => {
  if (!token) {
    window.location.href = '/login';
    return;
  }

  try {
    const decoded = jwtDecode(token);
    if (decoded.exp * 1000 < Date.now()) {
      throw new Error('Token expired');
    }
    setUser(decoded);
    fetchTransactions();
  } catch (error) {
    console.error('Authentication error:', error);
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
}, [token]);


const fetchTransactions = async () => {
  try {
    const token = localStorage.getItem("token");
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const res = await axios.get(`${API_URL}/transactions`, config);
    const data = res.data;

    setTransactions(data);

    const summary = calculateCategorySummary(data);
    setCategorySummary(summary);

    let income = 0;
    let expense = 0;
    data.forEach(txn => {
      if (txn.type === 'income') income += Number(txn.amount);
      else if (txn.type === 'expense') expense += Number(txn.amount);
    });
    setTotalIncome(income);
    setTotalExpense(expense);

    setMonthlySummary(getMonthlySummary(data));
    setYearlySummary(getYearlySummary(data));
  } catch (error) {
    console.error('Error fetching transactions:', error.response?.data || error.message);
  }
};


>>>>>>> 921ba539bb809ca69a1c0efa4cd1a0ab5fe70ecd

  const calculateCategorySummary = (transactions) => {
    const summary = {};

    transactions.forEach((txn) => {
<<<<<<< HEAD
      const category = txn.category?.trim() || txn.title?.trim() || 'Uncategorized';
      const type = txn.type;

      if (!summary[category]) {
        summary[category] = { income: 0, expense: 0 };
      }

      if (type === 'income') {
        summary[category].income += Number(txn.amount);
      } else if (type === 'expense') {
        summary[category].expense += Number(txn.amount);
=======
      const title = txn.title?.trim() || 'Untitled';
      const type = txn.type;

      if (!summary[title]) {
        summary[title] = { income: 0, expense: 0 };
      }

      if (type === 'income') {
        summary[title].income += Number(txn.amount);
      } else if (type === 'expense') {
        summary[title].expense += Number(txn.amount);
>>>>>>> 921ba539bb809ca69a1c0efa4cd1a0ab5fe70ecd
      }
    });

    return summary;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

<<<<<<< HEAD
  const handleBudgetFormChange = (e) => {
    setBudgetFormData({ ...budgetFormData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      if (editId) {
        await axios.put(`${API_URL}/transactions/${editId}`, formData, config);
      } else {
        await axios.post(
          `${API_URL}/transactions`,
          { ...formData, date: new Date().toISOString() },
          config
        );
      }

      setFormData({ title: '', amount: '', type: 'income', category: '' });
      setEditId(null);
      fetchTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error.response?.data || error.message);
    }
  };
=======
const handleSubmit = async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token");
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    if (editId) {
      await axios.put(`${API_URL}/transactions/${editId}`, formData, config);
    } else {
      await axios.post(
        `${API_URL}/transactions`,
        { ...formData, date: new Date().toISOString() },
        config
      );
    }

    setFormData({ title: '', amount: '', type: 'income', category: '' });
    setEditId(null);
    fetchTransactions();
  } catch (error) {
    console.error('Error saving transaction:', error.response?.data || error.message);
  }
};


>>>>>>> 921ba539bb809ca69a1c0efa4cd1a0ab5fe70ecd

  const handleEdit = (txn) => {
    setFormData({
      title: txn.title,
      amount: txn.amount,
      type: txn.type,
      category: txn.category || '',
    });
    setEditId(txn._id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/transactions/${id}`, config);
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const getMonthlySummary = (transactions) => {
<<<<<<< HEAD
    const summary = {};

    transactions.forEach(({ amount, type, date }) => {
      if (!date) return; 

      const d = new Date(date);
      if (isNaN(d)) return; 

      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      if (!summary[monthKey]) summary[monthKey] = { income: 0, expense: 0 };

      if (type === 'income') summary[monthKey].income += Number(amount);
      else if (type === 'expense') summary[monthKey].expense += Number(amount);
    });

    return summary;
  };

  const getYearlySummary = (transactions) => {
    const summary = {};

    transactions.forEach(({ amount, type, date }) => {
      if (!date) return;

      const d = new Date(date);
      if (isNaN(d)) return;

      const yearKey = `${d.getFullYear()}`;

      if (!summary[yearKey]) summary[yearKey] = { income: 0, expense: 0 };

      if (type === 'income') summary[yearKey].income += Number(amount);
      else if (type === 'expense') summary[yearKey].expense += Number(amount);
    });

    return summary;
  };

  const prepareChartData = () => {
    const chartData = Object.entries(monthlySummary).map(([month, values]) => ({
      month: new Date(month + '-01').toLocaleDateString('default', { month: 'short' }),
      income: values.income,
      expense: values.expense,
      balance: values.income - values.expense
    }));
    return chartData.sort((a, b) => new Date(a.month + ' 2024') - new Date(b.month + ' 2024'));
  };

  const prepareCategoryData = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FFD93D', '#6BCF7F'];
    return Object.entries(categorySummary)
      .filter(([_, values]) => values.expense > 0)
      .map(([name, values], index) => ({
        name,
        value: values.expense,
        color: colors[index % colors.length]
      }));
  };

  const prepareTrendData = () => {
    return Object.entries(monthlySummary).map(([month, values]) => {
      const balance = values.income - values.expense;
      const savingsRate = values.income > 0 ? ((balance / values.income) * 100).toFixed(1) : 0;
      
      return {
        month: new Date(month + '-01').toLocaleDateString('default', { month: 'short' }),
        balance,
        savings_rate: Number(savingsRate)
      };
    }).sort((a, b) => new Date(a.month + ' 2024') - new Date(b.month + ' 2024'));
  };

  // Chart Components (keeping them the same for brevity)
  const renderBarChart = () => (
    <div className="chart-container">
      <h3 className="chart-title">Monthly Income vs Expenses</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={prepareChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
          <Legend />
          <Bar dataKey="income" fill="#4CAF50" name="Income" />
          <Bar dataKey="expense" fill="#F44336" name="Expenses" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const renderPieChart = () => {
    const categoryData = prepareCategoryData();
    
    if (categoryData.length === 0) {
      return (
        <div className="chart-container">
          <h3 className="chart-title">Expense Categories Breakdown</h3>
          <div className="no-data-message">No expense data available</div>
        </div>
      );
    }

    return (
      <div className="chart-container">
        <h3 className="chart-title">Expense Categories Breakdown</h3>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pie-legend">
          {categoryData.map((item, index) => (
            <div key={index} className="legend-item">
              <div 
                className="legend-color"
                data-color={item.color}
              ></div>
              <span className="legend-text">{item.name}: ${item.value.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLineChart = () => (
    <div className="chart-container">
      <h3 className="chart-title">Savings Trend</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={prepareTrendData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => [
              name === 'balance' ? `$${value.toFixed(2)}` : `${value}%`,
              name === 'balance' ? 'Monthly Balance' : 'Savings Rate'
            ]} 
          />
          <Legend />
          <Line type="monotone" dataKey="balance" stroke="#4CAF50" strokeWidth={3} name="Monthly Balance" />
          <Line type="monotone" dataKey="savings_rate" stroke="#2196F3" strokeWidth={2} name="Savings Rate %" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  const renderCategoryBreakdown = () => {
    const getCategoryBreakdown = () => {
      const monthlyCategories = {};
      
      transactions.forEach(({ amount, type, date, category, title }) => {
        if (type !== 'expense' || !date) return;
        
        const d = new Date(date);
        if (isNaN(d)) return;
        
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const cat = category?.trim() || title?.trim() || 'Other';
        
        if (!monthlyCategories[monthKey]) {
          monthlyCategories[monthKey] = {};
        }
        
        if (!monthlyCategories[monthKey][cat]) {
          monthlyCategories[monthKey][cat] = 0;
        }
        
        monthlyCategories[monthKey][cat] += Number(amount);
      });
      
      return monthlyCategories;
    };

    const categoryBreakdown = getCategoryBreakdown();
    const allCategories = [...new Set(
      Object.values(categoryBreakdown).flatMap(month => Object.keys(month))
    )];
    
    const monthlyWithCategories = Object.entries(monthlySummary).map(([month, values]) => {
      const monthData = {
        month: new Date(month + '-01').toLocaleDateString('default', { month: 'short' }),
        ...values
      };
      
      const monthCategories = categoryBreakdown[month] || {};
      allCategories.forEach(category => {
        monthData[category] = monthCategories[category] || 0;
      });
      
      return monthData;
    }).sort((a, b) => new Date(a.month + ' 2024') - new Date(b.month + ' 2024'));

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FFD93D', '#6BCF7F'];

    return (
      <div className="chart-container">
        <h3 className="chart-title">Monthly Category Breakdown</h3>
        {allCategories.length === 0 ? (
          <div className="no-data-message">No expense categories to display</div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyWithCategories} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
              {allCategories.map((category, index) => (
                <Bar 
                  key={category}
                  dataKey={category} 
                  stackId="a" 
                  fill={colors[index % colors.length]} 
                  name={category} 
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    );
  };

  return (
    <div className="dashboard-container">
=======
  const summary = {};

  transactions.forEach(({ amount, type, date }) => {
    if (!date) return; 

    const d = new Date(date);
    if (isNaN(d)) return; 

    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    if (!summary[monthKey]) summary[monthKey] = { income: 0, expense: 0 };

    if (type === 'income') summary[monthKey].income += Number(amount);
    else if (type === 'expense') summary[monthKey].expense += Number(amount);
  });

  return summary;
};

const getYearlySummary = (transactions) => {
  const summary = {};

  transactions.forEach(({ amount, type, date }) => {
    if (!date) return;

    const d = new Date(date);
    if (isNaN(d)) return;

    const yearKey = `${d.getFullYear()}`;

    if (!summary[yearKey]) summary[yearKey] = { income: 0, expense: 0 };

    if (type === 'income') summary[yearKey].income += Number(amount);
    else if (type === 'expense') summary[yearKey].expense += Number(amount);
  });

  return summary;
};


  return (
    <div className="dashboard-container">

>>>>>>> 921ba539bb809ca69a1c0efa4cd1a0ab5fe70ecd
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Finance App</h2>
        </div>
        <div className="user-profile">
          <div className="user-avatar">{user?.name?.charAt(0) || "U"}</div>
          <div className="user-details">
            <h3>{user?.name || "User Name"}</h3>
<<<<<<< HEAD
=======
            <p>{user?.email || "user@example.com"}</p>
>>>>>>> 921ba539bb809ca69a1c0efa4cd1a0ab5fe70ecd
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className="active">Dashboard</button>
          <button>Transactions</button>
          <button>Reports</button>
          <button>Settings</button>
        </nav>
      </div>

      <div className="main-content">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Welcome back! Here's your financial summary.</p>
        </div>

<<<<<<< HEAD
        {/* Budget Alerts Section */}
        {budgetAlerts.length > 0 && (
          <div className="budget-alerts-container">
            <h2>🚨 Budget Alerts</h2>
            <div className="alerts-grid">
              {budgetAlerts.map((alert, index) => (
                <div key={index} className={`alert-card ${alert.type}`}>
                  <div className="alert-header">
                    <span className="alert-icon">
                      {alert.type === 'over' ? '🔴' : '⚠️'}
                    </span>
                    <h4>{alert.category}</h4>
                  </div>
                  <div className="alert-details">
                    <p>Spent: ${alert.spent.toFixed(2)} of ${alert.limit.toFixed(2)}</p>
                    <p className="alert-percentage">{alert.percentage}% used</p>
                    {alert.type === 'over' && (
                      <p className="over-budget">Over budget by ${(alert.spent - alert.limit).toFixed(2)}</p>
                    )}
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${alert.type}`}
                      style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="summary-grid">
          <div className="summary-card income-card">
            <h3>Total Income</h3>
            <p>${totalIncome.toFixed(2)}</p>
          </div>
          <div className="summary-card expense-card">
            <h3>Total Expense</h3>
            <p>${totalExpense.toFixed(2)}</p>
          </div>
          <div className="summary-card balance-card">
            <h3>Balance</h3>
            <p>${(totalIncome - totalExpense).toFixed(2)}</p>
          </div>
        </div>

        {/* Budget Management Section */}
        <div className="card budget-management">
          <div className="budget-header">
            <h2>Budget Management</h2>
            <button 
              className="primary-btn"
              onClick={() => setShowBudgetForm(!showBudgetForm)}
            >
              {showBudgetForm ? 'Cancel' : 'Add Budget'}
            </button>
          </div>

          {showBudgetForm && (
            <form onSubmit={handleBudgetSubmit} className="budget-form">
              <div className="form-row">
                <select
                  name="category"
                  value={budgetFormData.category}
                  onChange={handleBudgetFormChange}
                  required
                >
                  <option value="">Select Category</option>
                  {predefinedCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                
                <input
                  type="number"
                  name="monthlyLimit"
                  value={budgetFormData.monthlyLimit}
                  placeholder="Monthly Limit ($)"
                  onChange={handleBudgetFormChange}
                  required
                  step="0.01"
                  min="0"
                />
                
                <input
                  type="number"
                  name="alertThreshold"
                  value={budgetFormData.alertThreshold}
                  placeholder="Alert at (%)"
                  onChange={handleBudgetFormChange}
                  min="1"
                  max="100"
                />
              </div>
              
              <button type="submit" className="primary-btn">
                Set Budget
              </button>
            </form>
          )}

          {budgets.length > 0 && (
            <div className="budgets-list">
              <h3>Active Budgets</h3>
              <div className="budgets-grid">
                {budgets.map(budget => {
                  const currentMonth = new Date().toISOString().slice(0, 7);
                  const spent = getMonthlySpendingByCategory(transactions, budget.category, currentMonth);
                  const percentage = (spent / budget.monthlyLimit) * 100;
                  
                  return (
                    <div key={budget.id} className="budget-card">
                      <div className="budget-card-header">
                        <h4>{budget.category}</h4>
                        <button 
                          className="delete-btn"
                          onClick={() => deleteBudget(budget.id)}
                        >
                          ×
                        </button>
                      </div>
                      
                      <div className="budget-progress">
                        <div className="budget-amounts">
                          <span>${spent.toFixed(2)} / ${budget.monthlyLimit.toFixed(2)}</span>
                          <span className={`percentage ${percentage >= 100 ? 'over' : percentage >= budget.alertThreshold ? 'warning' : 'safe'}`}>
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        
                        <div className="progress-bar">
                          <div 
                            className={`progress-fill ${percentage >= 100 ? 'over' : percentage >= budget.alertThreshold ? 'warning' : 'safe'}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="budget-info">
                        <small>Alert at {budget.alertThreshold}%</small>
                        {percentage >= 100 && (
                          <small className="over-text">
                            Over by ${(spent - budget.monthlyLimit).toFixed(2)}
                          </small>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

=======
        <div className="summary-grid">
          <div className="summary-card income-card">
            <h3>Total Income</h3>
            <p>${totalIncome}</p>
          </div>
          <div className="summary-card expense-card">
            <h3>Total Expense</h3>
            <p>${totalExpense}</p>
          </div>
          <div className="summary-card balance-card">
            <h3>Balance</h3>
            <p>${totalIncome - totalExpense}</p>
          </div>
        </div>

>>>>>>> 921ba539bb809ca69a1c0efa4cd1a0ab5fe70ecd
        <div className="card">
          <h2>{editId ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <input
                type="text"
                name="title"
                value={formData.title}
                placeholder="Title"
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="amount"
                value={formData.amount}
                placeholder="Amount"
                onChange={handleChange}
                required
<<<<<<< HEAD
                step="0.01"
                min="0"
=======
>>>>>>> 921ba539bb809ca69a1c0efa4cd1a0ab5fe70ecd
              />
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
<<<<<<< HEAD
              <select 
                name="category" 
                value={formData.category} 
                onChange={handleChange}
              >
                <option value="">Select Category (Optional)</option>
                {predefinedCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
=======
>>>>>>> 921ba539bb809ca69a1c0efa4cd1a0ab5fe70ecd
            </div>
            <div className="form-actions">
              <button type="submit" className="primary-btn">
                {editId ? 'Update' : 'Add'} Transaction
              </button>
              {editId && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setEditId(null)}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="card">
          <h2>Transactions</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Amount</th>
                  <th>Type</th>
<<<<<<< HEAD
                  <th>Category</th>
=======
>>>>>>> 921ba539bb809ca69a1c0efa4cd1a0ab5fe70ecd
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn._id}>
                    <td>{txn.title}</td>
                    <td className={txn.type}>${txn.amount}</td>
                    <td>
                      <span className={`type-badge ${txn.type}`}>
                        {txn.type}
                      </span>
                    </td>
<<<<<<< HEAD
                    <td>{txn.category || 'Uncategorized'}</td>
=======
>>>>>>> 921ba539bb809ca69a1c0efa4cd1a0ab5fe70ecd
                    <td className="actions">
                      <button
                        className="icon-btn edit"
                        onClick={() => handleEdit(txn)}
                      >
                        Edit
                      </button>
                      <button
                        className="icon-btn delete"
                        onClick={() => handleDelete(txn._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

<<<<<<< HEAD
        {/* Enhanced Charts Section */}
        <div className="card enhanced-charts">
          <div className="charts-header">
            <div className="charts-header-content">
              <h2>Enhanced Financial Charts</h2>
              <p>Visual insights into your spending patterns</p>
            </div>
            
            <div className="chart-tabs">
              {[
                { id: 'bar', label: 'Income vs Expenses' },
                { id: 'pie', label: 'Category Breakdown' },
                { id: 'line', label: 'Savings Trend' },
                { id: 'stacked', label: 'Category Timeline' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveChart(tab.id)}
                  className={`chart-tab ${activeChart === tab.id ? 'active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="chart-content">
            {activeChart === 'bar' && renderBarChart()}
            {activeChart === 'pie' && renderPieChart()}
            {activeChart === 'line' && renderLineChart()}
            {activeChart === 'stacked' && renderCategoryBreakdown()}
          </div>
        </div>

=======
>>>>>>> 921ba539bb809ca69a1c0efa4cd1a0ab5fe70ecd
        <div className="card">
          <h2>Category Summary</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Income</th>
                  <th>Expense</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(categorySummary).map(([title, values]) => (
                  <tr key={title}>
                    <td>{title}</td>
<<<<<<< HEAD
                    <td className="income">${values.income.toFixed(2)}</td>
                    <td className="expense">${values.expense.toFixed(2)}</td>
=======
                    <td className="income">${values.income}</td>
                    <td className="expense">${values.expense}</td>
>>>>>>> 921ba539bb809ca69a1c0efa4cd1a0ab5fe70ecd
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="card">
          <h2>Monthly Spending Report</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Income</th>
                  <th>Expense</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(monthlySummary).map(([month, values]) => (
                  <tr key={month}>
                    <td>{new Date(`${month}-01`).toLocaleString('default', { month: 'long' })}</td>
                    <td className="income">${values.income.toFixed(2)}</td>
                    <td className="expense">${values.expense.toFixed(2)}</td>
                    <td>${(values.income - values.expense).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2>Yearly Spending Report</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Income</th>
                  <th>Expense</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(yearlySummary).map(([year, values]) => (
                  <tr key={year}>
                    <td>{year}</td>
                    <td className="income">${values.income.toFixed(2)}</td>
                    <td className="expense">${values.expense.toFixed(2)}</td>
                    <td>${(values.income - values.expense).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
<<<<<<< HEAD
=======


>>>>>>> 921ba539bb809ca69a1c0efa4cd1a0ab5fe70ecd
      </div>
    </div>
  );
};

export default Dashboard;