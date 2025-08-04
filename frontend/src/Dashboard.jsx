import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './dashboard.css';
import { jwtDecode } from 'jwt-decode';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categorySummary, setCategorySummary] = useState({});
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [monthlySummary, setMonthlySummary] = useState({});
  const [yearlySummary, setYearlySummary] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'income',
    category: '',
  });
  const [editId, setEditId] = useState(null);

  const token = localStorage.getItem("token");
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const API_URL = 'http://localhost:8000';


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


  const calculateCategorySummary = (transactions) => {
    const summary = {};

    transactions.forEach((txn) => {
      const title = txn.title?.trim() || 'Untitled';
      const type = txn.type;

      if (!summary[title]) {
        summary[title] = { income: 0, expense: 0 };
      }

      if (type === 'income') {
        summary[title].income += Number(txn.amount);
      } else if (type === 'expense') {
        summary[title].expense += Number(txn.amount);
      }
    });

    return summary;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`${API_URL}/transactions/${editId}`, formData, config);
      } else {
        await axios.post(`${API_URL}/transactions`, formData, config);
      }
      setFormData({ title: '', amount: '', type: 'income', category: '' });
      setEditId(null);
      fetchTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

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

  // useEffect(() => {
  //   fetchTransactions();
  // }, []);

  const getMonthlySummary = (transactions) => {
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

      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Finance App</h2>
        </div>
        <div className="user-profile">
          <div className="user-avatar">{user?.name?.charAt(0) || "U"}</div>
          <div className="user-details">
            <h3>{user?.name || "User Name"}</h3>
            <p>{user?.email || "user@example.com"}</p>
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
              />
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
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
                    <td className="income">${values.income}</td>
                    <td className="expense">${values.expense}</td>
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


      </div>
    </div>
  );
};

export default Dashboard;