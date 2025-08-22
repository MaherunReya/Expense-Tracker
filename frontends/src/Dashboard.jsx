import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './dashboard.css';
import { jwtDecode } from 'jwt-decode';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const Dashboard = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categorySummary, setCategorySummary] = useState({});
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [monthlySummary, setMonthlySummary] = useState({});
  const [yearlySummary, setYearlySummary] = useState({});
  const [activeChart, setActiveChart] = useState('bar');
  
  // Budget Alert System States
  const [budgets, setBudgets] = useState([]);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [budgetFormData, setBudgetFormData] = useState({
    category: '',
    monthlyLimit: '',
    alertThreshold: 80
  });

  // Recurring Bills States
  const [recurringBills, setRecurringBills] = useState([]);
  const [showBillForm, setShowBillForm] = useState(false);
  const [billAlerts, setBillAlerts] = useState([]);
  const [editBillId, setEditBillId] = useState(null);
  const [billFormData, setBillFormData] = useState({
    name: '',
    amount: '',
    category: '',
    frequency: 'monthly', 
    nextDueDate: '',
    reminderDays: 3,
    isActive: true,
    description: ''
  });
  
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'income',
    category: '',
    date: new Date().toISOString(),
  });
  const [editId, setEditId] = useState(null);

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

  const frequencyOptions = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  const token = localStorage.getItem("token");
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const [exportFilters, setExportFilters] = useState({
    startDate: '',
    endDate: '',
    type: '',
    category: ''
  });

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
      loadBudgets();
      loadRecurringBills();
      loadDebts();
    } catch (error) {
      console.error('Authentication error:', error);
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }, [token]);

  // Load budgets
 const loadBudgets = async () => {
  try {
    const res = await axios.get(`${API_URL}/budgets`, config);
    setBudgets(res.data);
  } catch (error) {
    console.error('Error loading budgets:', error);
  }
};
 
  const loadRecurringBills = async () => {
    try {
      const res = await axios.get(`${API_URL}/recurring-bills`, config);
      setRecurringBills(res.data);
      checkBillAlerts(res.data);
    } catch (error) {
      console.error('Error loading recurring bills:', error);
    }
  };

  const saveBudgets = async (newBudgets) => {
    setBudgets(newBudgets);
  };
  const saveRecurringBills = async (newBills) => {
    setRecurringBills(newBills);
    checkBillAlerts(newBills);
  };

  // Recurring Bills Functions
  const getNextDueDate = (lastDate, frequency) => {
    const date = new Date(lastDate);
    switch (frequency) {
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }
    return date.toISOString().split('T')[0];
  };

  const checkBillAlerts = (bills = recurringBills) => {
    const today = new Date();
    const alerts = [];

    bills.forEach(bill => {
      if (!bill.isActive) return;

      const dueDate = new Date(bill.nextDueDate);
      const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= bill.reminderDays && daysDiff >= 0) {
        alerts.push({
          ...bill,
          daysUntilDue: daysDiff,
          isOverdue: daysDiff < 0
        });
      } else if (daysDiff < 0) {
        alerts.push({
          ...bill,
          daysUntilDue: Math.abs(daysDiff),
          isOverdue: true
        });
      }
    });

    setBillAlerts(alerts.sort((a, b) => a.daysUntilDue - b.daysUntilDue));
  };

  const handleBillFormChange = (e) => {
    setBillFormData({ ...billFormData, [e.target.name]: e.target.value });
  };

    const handleBillSubmit = async (e) => {
    e.preventDefault();
    
    if (!billFormData.name || !billFormData.amount || !billFormData.nextDueDate) {
      alert('Please fill in all required fields');
      return;
    }

    const billData = {
      ...billFormData,
      amount: Number(billFormData.amount),
      reminderDays: Number(billFormData.reminderDays)
    };

    try {
      if (editBillId) {
        await axios.put(`${API_URL}/recurring-bills/${editBillId}`, billData, config);
      } else {
        await axios.post(`${API_URL}/recurring-bills`, billData, config);
      }
      
      setBillFormData({
        name: '', amount: '', category: '', frequency: 'monthly',
        nextDueDate: '', reminderDays: 3, isActive: true, description: ''
      });
      setEditBillId(null);
      setShowBillForm(false);
      await loadRecurringBills();
    } catch (error) {
      console.error('Error saving bill:', error);
      alert('Failed to save recurring bill');
    }
  };

    const editBill = (bill) => {
      setBillFormData({
        name: bill.name,
        amount: bill.amount.toString(),
        category: bill.category,
        frequency: bill.frequency,
        nextDueDate: bill.nextDueDate,
        reminderDays: bill.reminderDays.toString(),
        isActive: bill.isActive,
        description: bill.description || ''
      });
      setEditBillId(bill._id);
      setShowBillForm(true);
    };

  const deleteBill = async (billId) => {
    if (confirm('Are you sure you want to delete this recurring bill?')) {
      try {
        await axios.delete(`${API_URL}/recurring-bills/${billId}`, config);
        await loadRecurringBills();
      } catch (error) {
        console.error('Error deleting bill:', error);
      }
    }
  };

  const toggleBillStatus = async (billId) => {
    const bill = recurringBills.find(b => b._id === billId);
    if (!bill) return;

    try {
      await axios.put(`${API_URL}/recurring-bills/${billId}`, 
        { ...bill, isActive: !bill.isActive }, config);
      await loadRecurringBills();
    } catch (error) {
      console.error('Error updating bill status:', error);
    }
  };

  const markBillAsPaid = async (billId) => {
    const bill = recurringBills.find(b => b._id === billId);
    if (!bill) return;

    try {
      const newTransaction = {
        title: `${bill.name} (Recurring)`,
        amount: bill.amount,
        type: 'expense',
        category: bill.category,
        date: new Date().toISOString()
      };

      await axios.post(`${API_URL}/transactions`, newTransaction, config);
      

      const nextDue = getNextDueDate(bill.nextDueDate, bill.frequency);
      await axios.put(`${API_URL}/recurring-bills/${billId}`, {
        ...bill,
        nextDueDate: nextDue,
        lastPaidDate: new Date().toISOString()
      }, config);

      await Promise.all([fetchTransactions(), loadRecurringBills()]);
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      alert('Failed to mark bill as paid. Please try again.');
    }
  };

  // Debt/Loan Tracker
  const [debts, setDebts] = useState([]);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [editDebtId, setEditDebtId] = useState(null);
  const [debtFormData, setDebtFormData] = useState({
    name: '',
    totalAmount: '',
    currentBalance: '',
    interestRate: '',
    minimumPayment: '',
    dueDate: '',
    lender: '',
    debtType: 'credit_card', 
    paymentFrequency: 'monthly'
  });
  const loadDebts = async () => {
  try {
    const res = await axios.get(`${API_URL}/debts`, config);
    setDebts(res.data);
  } catch (error) {
    console.error('Error loading debts:', error);
  }
};

const saveDebt = async (debtData) => {
  try {
    if (editDebtId) {
      await axios.put(`${API_URL}/debts/${editDebtId}`, debtData, config);
    } else {
      await axios.post(`${API_URL}/debts`, debtData, config);
    }
    await loadDebts();
  } catch (error) {
    console.error('Error saving debt:', error);
    throw error;
  }
};

const deleteDebt = async (debtId) => {
  if (confirm('Are you sure you want to delete this debt?')) {
    try {
      await axios.delete(`${API_URL}/debts/${debtId}`, config);
      await loadDebts();
    } catch (error) {
      console.error('Error deleting debt:', error);
    }
  }
};

const recordDebtPayment = async (debtId, paymentAmount) => {
  try {
    await axios.post(`${API_URL}/debts/${debtId}/payment`, {
      amount: paymentAmount
    }, config);
    await Promise.all([loadDebts(), fetchTransactions()]);
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
};
const getTotalDebt = () => {
  return debts.reduce((total, debt) => total + debt.currentBalance, 0);
};

const handleDebtFormChange = (e) => {
  setDebtFormData({ ...debtFormData, [e.target.name]: e.target.value });
};

const handleDebtSubmit = async (e) => {
  e.preventDefault();
  
  if (!debtFormData.name || !debtFormData.totalAmount || !debtFormData.currentBalance) {
    alert('Please fill in all required fields');
    return;
  }

  const debtData = {
    ...debtFormData,
    totalAmount: Number(debtFormData.totalAmount),
    currentBalance: Number(debtFormData.currentBalance),
    interestRate: Number(debtFormData.interestRate) || 0,
    minimumPayment: Number(debtFormData.minimumPayment) || 0
  };

  try {
    await saveDebt(debtData);
    setDebtFormData({
      name: '', totalAmount: '', currentBalance: '', interestRate: '',
      minimumPayment: '', dueDate: '', lender: '', debtType: 'credit_card',
      paymentFrequency: 'monthly'
    });
    setEditDebtId(null);
    setShowDebtForm(false);
  } catch (error) {
    alert('Failed to save debt');
  }
};

const editDebt = (debt) => {
  setDebtFormData({
    name: debt.name,
    totalAmount: debt.totalAmount.toString(),
    currentBalance: debt.currentBalance.toString(),
    interestRate: debt.interestRate.toString(),
    minimumPayment: debt.minimumPayment.toString(),
    dueDate: debt.dueDate ? debt.dueDate.split('T')[0] : '',
    lender: debt.lender || '',
    debtType: debt.debtType,
    paymentFrequency: debt.paymentFrequency
  });
  setEditDebtId(debt._id);
  setShowDebtForm(true);
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
      
      checkBudgetAlerts(data);
    } catch (error) {
      console.error('Error fetching transactions:', error.response?.data || error.message);
    }
  };

  useEffect(() => {
    if (user && transactions.length > 0 && budgets.length > 0) {
      checkBudgetAlerts(transactions);
    }
  }, [user, transactions, budgets]);

  // Budget Alert Logic
  const checkBudgetAlerts = (transactionData = transactions) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
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


  // Budget Form Handlers
  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    
    if (!budgetFormData.category || !budgetFormData.monthlyLimit) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await axios.post(`${API_URL}/budgets`, budgetFormData, config);
      setBudgetFormData({ category: '', monthlyLimit: '', alertThreshold: 80 });
      setShowBudgetForm(false);
      await loadBudgets();
      setTimeout(() => checkBudgetAlerts(), 100);
    } catch (error) {
      console.error('Error creating budget:', error);
      alert('Failed to create budget');
    }
  };
  const deleteBudget = async (budgetId) => {
    try {
      await axios.delete(`${API_URL}/budgets/${budgetId}`, config);
      await loadBudgets();
      checkBudgetAlerts();
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
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


  const calculateCategorySummary = (transactions) => {
    const summary = {};

    transactions.forEach((txn) => {
      const category = txn.category?.trim() || txn.title?.trim() || 'Uncategorized';
      const type = txn.type;

      if (!summary[category]) {
        summary[category] = { income: 0, expense: 0 };
      }

      if (type === 'income') {
        summary[category].income += Number(txn.amount);
      } else if (type === 'expense') {
        summary[category].expense += Number(txn.amount);
      }
    });

    return summary;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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

  // Chart Components
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


  const getUpcomingBillsTotal = () => {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    return recurringBills
      .filter(bill => bill.isActive && new Date(bill.nextDueDate) <= nextMonth)
      .reduce((total, bill) => total + bill.amount, 0);
  };

    const handleExport = async (format) => {
  try {
    const params = new URLSearchParams();
    if (exportFilters.startDate) params.append('startDate', exportFilters.startDate);
    if (exportFilters.endDate) params.append('endDate', exportFilters.endDate);
    if (exportFilters.type) params.append('type', exportFilters.type);
    if (exportFilters.category) params.append('category', exportFilters.category);

    const url = `${API_URL}/transactions/export/${format}?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    if (!response.ok) throw new Error('Export failed');

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `transactions.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    // delay revoking the object URL
    setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);

  } catch (error) {
    console.error('Export error:', error);
    alert('Failed to export data. Please try again.');
  }
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
          </div>
        </div>

          <nav className="sidebar-nav">
            <button 
              className={activePage === 'dashboard' ? 'active' : ''} 
              onClick={() => setActivePage('dashboard')}
            >
              Dashboard
            </button>
                        <button 
              className={activePage === 'bill' ? 'active' : ''} 
              onClick={() => setActivePage('bill')}
            >
              Bills
            </button>
            <button 
              className={activePage === 'budget' ? 'active' : ''} 
              onClick={() => setActivePage('budget')}
            >
              Budget
            </button>
            <button 
              className={activePage === 'transactions' ? 'active' : ''} 
              onClick={() => setActivePage('transactions')}
            >
              Transactions
            </button>
            <button 
              className={activePage === 'charts' ? 'active' : ''} 
              onClick={() => setActivePage('charts')}
            >
              Charts
            </button>
            <button 
              className={activePage === 'debts' ? 'active' : ''} 
              onClick={() => setActivePage('debts')}
            >
              Debts
            </button>
            <button 
              className={activePage === 'category' ? 'active' : ''} 
              onClick={() => setActivePage('category')}
            >
              Category
            </button>
            <button 
              className={activePage === 'reports' ? 'active' : ''} 
              onClick={() => setActivePage('reports')}
            >
              Reports
            </button>
            <button 
              className={activePage === 'settings' ? 'active' : ''} 
              onClick={() => setActivePage('settings')}
            >
              Settings
            </button>
          </nav>
      </div>

<div className="main-content">
        {activePage === 'dashboard' && (
          <>
            {/* Dashboard header */}
            <div className="dashboard-header">
              <h1>Dashboard</h1>
              <p>Welcome back! Here's your financial summary.</p>
            </div>

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
              <div className="summary-card bills-card">
                <h3>Upcoming Bills</h3>
                <p>${getUpcomingBillsTotal().toFixed(2)}</p>
                <small>Next 30 days</small>
              </div>
              <div className="summary-card debt-card">
                <h3>Total Debt</h3>
                <p>${getTotalDebt().toFixed(2)}</p>
              </div>
            </div>

            {/* Budget alerts */}
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

            {/* Bill alerts */}
            {billAlerts.length > 0 && (
              <div className="bill-alerts-container">
                <h2>Bill Reminders</h2>
                <div className="alerts-grid">
                  {billAlerts.map((bill, index) => (
                    <div key={index} className={`bill-alert-card ${bill.isOverdue ? 'overdue' : 'upcoming'}`}>
                      <div className="bill-alert-header">
                        <span className="bill-alert-icon">
                          {bill.isOverdue ? '🚨' : '⏰'}
                        </span>
                        <h4>{bill.name}</h4>
                      </div>
                      <div className="bill-alert-details">
                        <p className="bill-amount">${bill.amount.toFixed(2)}</p>
                        <p className="bill-category">{bill.category}</p>
                        <p className={`bill-status ${bill.isOverdue ? 'overdue' : 'upcoming'}`}>
                          {bill.isOverdue 
                            ? `Overdue by ${bill.daysUntilDue} day${bill.daysUntilDue !== 1 ? 's' : ''}`
                            : bill.daysUntilDue === 0 
                              ? 'Due today'
                              : `Due in ${bill.daysUntilDue} day${bill.daysUntilDue !== 1 ? 's' : ''}`
                          }
                        </p>
                      </div>
                      <div className="bill-alert-actions">
                        <button className="pay-bill-btn" onClick={() => markBillAsPaid(bill._id)}>
                          Mark as Paid
                        </button>
                        <button className="icon-btn toggle" onClick={() => toggleBillStatus(bill._id)}>
                          ⏸️
                        </button>
                        <button className="icon-btn delete" onClick={() => deleteBill(bill._id)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction form */}
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
                    step="0.01"
                    min="0"
                  />
                  <select name="type" value={formData.type} onChange={handleChange}>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
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

            {/* Recent Transactions table */}
            <div className="card">
              <h2>Recent Transactions</h2>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Amount</th>
                      <th>Type</th>
                      <th>Category</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 5).map((txn) => (
                      <tr key={txn._id}>
                        <td>{txn.title}</td>
                        <td className={txn.type}>${txn.amount}</td>
                        <td>
                          <span className={`type-badge ${txn.type}`}>
                            {txn.type}
                          </span>
                        </td>
                        <td>{txn.category || 'Uncategorized'}</td>
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

            {/* Budget management section - condensed view */}
            {budgets.length > 0 && (
              <div className="card budget-management">
                <div className="budget-header">
                  <h2>Active Budgets Overview</h2>
                  <button 
                    className="secondary-btn"
                    onClick={() => setActivePage('budget')}
                  >
                    Manage Budgets
                  </button>
                </div>

                <div className="budgets-grid">
                  {budgets.slice(0, 3).map(budget => {
                    const currentMonth = new Date().toISOString().slice(0, 7);
                    const spent = getMonthlySpendingByCategory(transactions, budget.category, currentMonth);
                    const percentage = (spent / budget.monthlyLimit) * 100;
                    
                    return (
                      <div key={budget.id} className="budget-card">
                        <div className="budget-card-header">
                          <h4>{budget.category}</h4>
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
                      </div>
                    );
                  })}
                </div>
                {budgets.length > 3 && (
                  <p className="text-center">
                    <button 
                      className="link-btn"
                      onClick={() => setActivePage('budget')}
                    >
                      View all {budgets.length} budgets
                    </button>
                  </p>
                )}
              </div>
            )}

            {/* Recurring bills section - condensed view */}
            {recurringBills.length > 0 && (
              <div className="card recurring-bills-management">
                <div className="bills-header">
                  <div className="bills-header-content">
                    <h2>Upcoming Bills</h2>
                  </div>
                  <button 
                    className="secondary-btn"
                    onClick={() => setActivePage('bill')}
                  >
                    Manage Bills
                  </button>
                </div>

                <div className="bills-grid">
                  {recurringBills.slice(0, 3).map(bill => {
                    const dueDate = new Date(bill.nextDueDate);
                    const today = new Date();
                    const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                    const isOverdue = daysDiff < 0;
                    const isDueSoon = daysDiff <= bill.reminderDays && daysDiff >= 0;
                    
                    return (
                      <div key={bill._id} className={`bill-card ${!bill.isActive ? 'inactive' : ''} ${isOverdue ? 'overdue' : isDueSoon ? 'due-soon' : ''}`}>
                        <div className="bill-card-header">
                          <div className="bill-info">
                            <h4>{bill.name}</h4>
                            <span className="bill-frequency">{bill.frequency}</span>
                          </div>
                        </div>
                        
                        <div className="bill-details">
                          <div className="bill-amount">${bill.amount.toFixed(2)}</div>
                          
                          <div className="bill-due-date">
                            <span className="due-label">Next due:</span>
                            <span className={`due-date ${isOverdue ? 'overdue' : isDueSoon ? 'due-soon' : ''}`}>
                              {dueDate.toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className={`bill-status ${isOverdue ? 'overdue' : isDueSoon ? 'due-soon' : 'upcoming'}`}>
                            {isOverdue 
                              ? `Overdue by ${Math.abs(daysDiff)} day${Math.abs(daysDiff) !== 1 ? 's' : ''}`
                              : daysDiff === 0 
                                ? 'Due today'
                                : `Due in ${daysDiff} day${daysDiff !== 1 ? 's' : ''}`
                            }
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {recurringBills.length > 3 && (
                  <p className="text-center">
                    <button 
                      className="link-btn"
                      onClick={() => setActivePage('bill')}
                    >
                      View all {recurringBills.length} bills
                    </button>
                  </p>
                )}
              </div>
            )}

            {/* Debt overview - condensed view */}
            {debts.length > 0 && (
              <div className="card debt-management">
                <div className="debt-header">
                  <div className="debt-header-content">
                    <h2>Debt Overview</h2>
                  </div>
                  <button 
                    className="secondary-btn"
                    onClick={() => setActivePage('debts')}
                  >
                    Manage Debts
                  </button>
                </div>

                <div className="debts-grid">
                  {debts.slice(0, 3).map(debt => {
                    const payoffPercentage = ((debt.totalAmount - debt.currentBalance) / debt.totalAmount) * 100;
                    
                    return (
                      <div key={debt._id} className="debt-card">
                        <div className="debt-card-header">
                          <div className="debt-info">
                            <h4>{debt.name}</h4>
                            <span className="debt-type">{debt.debtType.replace('_', ' ')}</span>
                          </div>
                        </div>
                        
                        <div className="debt-details">
                          <div className="debt-balance">${debt.currentBalance.toFixed(2)}</div>
                          <div className="debt-original">of ${debt.totalAmount.toFixed(2)}</div>
                          
                          <div className="debt-progress">
                            <div className="progress-bar">
                              <div 
                                className="progress-fill paid"
                                style={{ width: `${payoffPercentage}%` }}
                              ></div>
                            </div>
                            <span className="progress-text">{payoffPercentage.toFixed(1)}% paid off</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {debts.length > 3 && (
                  <p className="text-center">
                    <button 
                      className="link-btn"
                      onClick={() => setActivePage('debts')}
                    >
                      View all {debts.length} debts
                    </button>
                  </p>
                )}
              </div>
            )}

            {/* Enhanced Financial Charts */}
            <div className="card enhanced-charts">
              <div className="charts-header">
                <div className="charts-header-content">
                  <h2>Financial Charts Overview</h2>
                </div>
                <button 
                  className="secondary-btn"
                  onClick={() => setActivePage('charts')}
                >
                  View All Charts
                </button>
              </div>
              
              <div className="chart-content">
                {renderBarChart()}
              </div>
            </div>

            {/* Category */}
            <div className="card">
              <div className="budget-header">
                <h2>Category Summary</h2>
                <button 
                  className="secondary-btn"
                  onClick={() => setActivePage('category')}
                >
                  View Details
                </button>
              </div>
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
                    {Object.entries(categorySummary).slice(0, 5).map(([title, values]) => (
                      <tr key={title}>
                        <td>{title}</td>
                        <td className="income">${values.income.toFixed(2)}</td>
                        <td className="expense">${values.expense.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {Object.entries(categorySummary).length > 5 && (
                  <p className="text-center">
                    <button 
                      className="link-btn"
                      onClick={() => setActivePage('category')}
                    >
                      View all {Object.entries(categorySummary).length} categories
                    </button>
                  </p>
                )}
              </div>
            </div>

            {/* Financial Reports */}
            <div className="card">
              <div className="budget-header">
                <h2>Financial Reports</h2>
                <button 
                  className="secondary-btn"
                  onClick={() => setActivePage('reports')}
                >
                  View Full Reports
                </button>
              </div>

              {/* Monthly Report Preview */}
              <div className="report-section">
                <h3>Recent Monthly Summary</h3>
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
                      {Object.entries(monthlySummary).slice(0, 3).map(([month, values]) => (
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

              {/* Yearly Report Preview */}
              <div className="report-section">
                <h3>Yearly Summary</h3>
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
                      {Object.entries(yearlySummary).slice(0, 2).map(([year, values]) => (
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
          </>
        )}

        {activePage === 'bill' && (
          <>
            <div className="dashboard-header">
              <h1>Bills Management</h1>
              <p>Track and manage your recurring bills and payments.</p>
            </div>

            {billAlerts.length > 0 && (
              <div className="bill-alerts-container">
                <h2>Bill Reminders</h2>
                <div className="alerts-grid">
                  {billAlerts.map((bill, index) => (
                    <div key={index} className={`bill-alert-card ${bill.isOverdue ? 'overdue' : 'upcoming'}`}>
                      <div className="bill-alert-header">
                        <span className="bill-alert-icon">
                          {bill.isOverdue ? '🚨' : '⏰'}
                        </span>
                        <h4>{bill.name}</h4>
                      </div>
                      <div className="bill-alert-details">
                        <p className="bill-amount">${bill.amount.toFixed(2)}</p>
                        <p className="bill-category">{bill.category}</p>
                        <p className={`bill-status ${bill.isOverdue ? 'overdue' : 'upcoming'}`}>
                          {bill.isOverdue 
                            ? `Overdue by ${bill.daysUntilDue} day${bill.daysUntilDue !== 1 ? 's' : ''}`
                            : bill.daysUntilDue === 0 
                              ? 'Due today'
                              : `Due in ${bill.daysUntilDue} day${bill.daysUntilDue !== 1 ? 's' : ''}`
                          }
                        </p>
                      </div>
                      <div className="bill-alert-actions">
                        <button className="pay-bill-btn" onClick={() => markBillAsPaid(bill._id)}>
                          Mark as Paid
                        </button>
                        <button className="icon-btn toggle" onClick={() => toggleBillStatus(bill._id)}>
                          ⏸️
                        </button>
                        <button className="icon-btn delete" onClick={() => deleteBill(bill._id)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card recurring-bills-management">
              <div className="bills-header">
                <div className="bills-header-content">
                  <h2>Recurring Bills Tracker</h2>
                </div>
                <button 
                  className="primary-btn"
                  onClick={() => {
                    setShowBillForm(!showBillForm);
                    setEditBillId(null);
                    setBillFormData({
                      name: '',
                      amount: '',
                      category: '',
                      frequency: 'monthly',
                      nextDueDate: '',
                      reminderDays: 3,
                      isActive: true,
                      description: ''
                    });
                  }}
                >
                  {showBillForm ? 'Cancel' : 'Add Bill'}
                </button>
              </div>

              {showBillForm && (
                <form onSubmit={handleBillSubmit} className="bill-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Bill Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={billFormData.name}
                        placeholder="e.g., Electric Bill, Rent, Netflix"
                        onChange={handleBillFormChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Amount *</label>
                      <input
                        type="number"
                        name="amount"
                        value={billFormData.amount}
                        placeholder="0.00"
                        onChange={handleBillFormChange}
                        required
                        step="0.01"
                        min="0"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Category</label>
                      <select
                        name="category"
                        value={billFormData.category}
                        onChange={handleBillFormChange}
                      >
                        <option value="">Select Category</option>
                        {predefinedCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Frequency *</label>
                      <select
                        name="frequency"
                        value={billFormData.frequency}
                        onChange={handleBillFormChange}
                        required
                      >
                        {frequencyOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Next Due Date *</label>
                      <input
                        type="date"
                        name="nextDueDate"
                        value={billFormData.nextDueDate}
                        onChange={handleBillFormChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Reminder (days before)</label>
                      <input
                        type="number"
                        name="reminderDays"
                        value={billFormData.reminderDays}
                        onChange={handleBillFormChange}
                        min="0"
                        max="30"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group full-width">
                    <label>Description (optional)</label>
                    <textarea
                      name="description"
                      value={billFormData.description}
                      placeholder="Additional notes about this bill..."
                      onChange={handleBillFormChange}
                      rows="2"
                    />
                  </div>
                  
                  <div className="form-actions">
                    <button type="submit" className="primary-btn">
                      {editBillId ? 'Update Bill' : 'Add Bill'}
                    </button>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => {
                        setShowBillForm(false);
                        setEditBillId(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {recurringBills.length > 0 && (
                <div className="bills-list">
                  <h3>Your Recurring Bills ({recurringBills.length})</h3>
                  <div className="bills-grid">
                    {recurringBills.map(bill => {
                      const dueDate = new Date(bill.nextDueDate);
                      const today = new Date();
                      const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                      const isOverdue = daysDiff < 0;
                      const isDueSoon = daysDiff <= bill.reminderDays && daysDiff >= 0;
                      
                      return (
                        <div key={bill._id} className={`bill-card ${!bill.isActive ? 'inactive' : ''} ${isOverdue ? 'overdue' : isDueSoon ? 'due-soon' : ''}`}>
                          <div className="bill-card-header">
                            <div className="bill-info">
                              <h4>{bill.name}</h4>
                              <span className="bill-frequency">{bill.frequency}</span>
                            </div>
                            <div className="bill-actions">
                              <button 
                                className="icon-btn edit"
                                onClick={() => editBill(bill)}
                                title="Edit bill"
                              >
                                ✏️
                              </button>
                              <button 
                                className="icon-btn toggle"
                                onClick={() => toggleBillStatus(bill._id)}
                                title={bill.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {bill.isActive ? '⏸️' : '▶️'}
                              </button>
                              <button 
                                className="icon-btn delete"
                                onClick={() => deleteBill(bill._id)}
                                title="Delete bill"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          
                          <div className="bill-details">
                            <div className="bill-amount">${bill.amount.toFixed(2)}</div>
                            {bill.category && (
                              <div className="bill-category">{bill.category}</div>
                            )}
                            
                            <div className="bill-due-date">
                              <span className="due-label">Next due:</span>
                              <span className={`due-date ${isOverdue ? 'overdue' : isDueSoon ? 'due-soon' : ''}`}>
                                {dueDate.toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className={`bill-status ${isOverdue ? 'overdue' : isDueSoon ? 'due-soon' : 'upcoming'}`}>
                              {isOverdue 
                                ? `Overdue by ${Math.abs(daysDiff)} day${Math.abs(daysDiff) !== 1 ? 's' : ''}`
                                : daysDiff === 0 
                                  ? 'Due today'
                                  : `Due in ${daysDiff} day${daysDiff !== 1 ? 's' : ''}`
                              }
                            </div>
                            
                            {bill.description && (
                              <div className="bill-description">{bill.description}</div>
                            )}
                          </div>
                          
                          {bill.isActive && (isDueSoon || isOverdue) && (
                            <div className="bill-card-actions">
                              <button 
                                className="pay-bill-btn"
                                onClick={() => markBillAsPaid(bill._id)}
                              >
                                Mark as Paid
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {recurringBills.length === 0 && !showBillForm && (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h3>No recurring bills yet</h3>
                  <p>Add your first recurring bill to start tracking your regular expenses and never miss a payment.</p>
                  <button 
                    className="primary-btn"
                    onClick={() => setShowBillForm(true)}
                  >
                    Add Your First Bill
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {activePage === 'budget' && (
          <>
            <div className="dashboard-header">
              <h1>Budget Management</h1>
              <p>Set and track your spending budgets by category.</p>
            </div>

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
                              onClick={() => deleteBudget(budget._id)}
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
          </>
        )}

        {activePage === 'transactions' && (
          <>
            <div className="dashboard-header">
              <h1>All Transactions</h1>
              <p>View and manage all your financial transactions.</p>
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
                    step="0.01"
                    min="0"
                  />
                  <select name="type" value={formData.type} onChange={handleChange}>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
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
              <h2>All Transactions</h2>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Amount</th>
                      <th>Type</th>
                      <th>Category</th>
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
                        <td>{txn.category || 'Uncategorized'}</td>
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
          </>
        )}

        {activePage === 'charts' && (
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
        )}

        {activePage === 'debts' && (
          <div className="card debt-management">
            <div className="debt-header">
              <div className="debt-header-content">
                <h2>💳 Debt Tracker</h2>
                <p>Track and manage your debts to achieve financial freedom</p>
              </div>
              <button 
                className="primary-btn"
                onClick={() => {
                  setShowDebtForm(!showDebtForm);
                  setEditDebtId(null);
                  setDebtFormData({
                    name: '', totalAmount: '', currentBalance: '', interestRate: '',
                    minimumPayment: '', dueDate: '', lender: '', debtType: 'credit_card',
                    paymentFrequency: 'monthly'
                  });
                }}
              >
                {showDebtForm ? 'Cancel' : 'Add Debt'}
              </button>
            </div>

            {showDebtForm && (
              <form onSubmit={handleDebtSubmit} className="debt-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Debt Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={debtFormData.name}
                      placeholder="e.g., Credit Card, Car Loan"
                      onChange={handleDebtFormChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Total Amount *</label>
                    <input
                      type="number"
                      name="totalAmount"
                      value={debtFormData.totalAmount}
                      placeholder="Original debt amount"
                      onChange={handleDebtFormChange}
                      required
                      step="0.01"
                      min="0"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Current Balance *</label>
                    <input
                      type="number"
                      name="currentBalance"
                      value={debtFormData.currentBalance}
                      placeholder="Current amount owed"
                      onChange={handleDebtFormChange}
                      required
                      step="0.01"
                      min="0"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Interest Rate (%)</label>
                    <input
                      type="number"
                      name="interestRate"
                      value={debtFormData.interestRate}
                      placeholder="Annual interest rate"
                      onChange={handleDebtFormChange}
                      step="0.01"
                      min="0"
                      max="100"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Minimum Payment</label>
                    <input
                      type="number"
                      name="minimumPayment"
                      value={debtFormData.minimumPayment}
                      placeholder="Monthly minimum payment"
                      onChange={handleDebtFormChange}
                      step="0.01"
                      min="0"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Due Date</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={debtFormData.dueDate}
                      onChange={handleDebtFormChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Lender</label>
                    <input
                      type="text"
                      name="lender"
                      value={debtFormData.lender}
                      placeholder="Bank or lender name"
                      onChange={handleDebtFormChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Debt Type</label>
                    <select
                      name="debtType"
                      value={debtFormData.debtType}
                      onChange={handleDebtFormChange}
                    >
                      <option value="credit_card">Credit Card</option>
                      <option value="loan">Personal Loan</option>
                      <option value="mortgage">Mortgage</option>
                      <option value="student_loan">Student Loan</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Payment Frequency</label>
                    <select
                      name="paymentFrequency"
                      value={debtFormData.paymentFrequency}
                      onChange={handleDebtFormChange}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="primary-btn">
                    {editDebtId ? 'Update Debt' : 'Add Debt'}
                  </button>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => {
                      setShowDebtForm(false);
                      setEditDebtId(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {debts.length > 0 && (
              <div className="debts-list">
                <h3>Your Debts ({debts.length})</h3>
                <div className="debts-grid">
                  {debts.map(debt => {
                    const payoffPercentage = ((debt.totalAmount - debt.currentBalance) / debt.totalAmount) * 100;
                    
                    return (
                      <div key={debt._id} className="debt-card">
                        <div className="debt-card-header">
                          <div className="debt-info">
                            <h4>{debt.name}</h4>
                            <span className="debt-type">{debt.debtType.replace('_', ' ')}</span>
                          </div>
                          <div className="debt-actions">
                            <button 
                              className="icon-btn edit"
                              onClick={() => editDebt(debt)}
                            >
                              Edit
                            </button>
                            <button 
                              className="icon-btn delete"
                              onClick={() => deleteDebt(debt._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        
                        <div className="debt-details">
                          <div className="debt-balance">${debt.currentBalance.toFixed(2)}</div>
                          <div className="debt-original">of ${debt.totalAmount.toFixed(2)}</div>
                          
                          {debt.lender && (
                            <div className="debt-lender">{debt.lender}</div>
                          )}
                          
                          {debt.interestRate > 0 && (
                            <div className="debt-rate">{debt.interestRate}% APR</div>
                          )}
                          
                          {debt.minimumPayment > 0 && (
                            <div className="debt-payment">Min: ${debt.minimumPayment.toFixed(2)}/{debt.paymentFrequency}</div>
                          )}
                          
                          <div className="debt-progress">
                            <div className="progress-bar">
                              <div 
                                className="progress-fill paid"
                                style={{ width: `${payoffPercentage}%` }}
                              ></div>
                            </div>
                            <span className="progress-text">{payoffPercentage.toFixed(1)}% paid off</span>
                          </div>
                        </div>
                        
                        <div className="debt-card-actions">
                          <button 
                            className="payment-btn"
                            onClick={() => {
                              const amount = prompt('Enter payment amount:');
                              if (amount && !isNaN(amount) && Number(amount) > 0) {
                                recordDebtPayment(debt._id, Number(amount));
                              }
                            }}
                          >
                            Record Payment
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {debts.length === 0 && !showDebtForm && (
              <div className="empty-state">
                <div className="empty-icon">Card</div>
                <h3>No debts tracked yet</h3>
                <p>Add your debts to track payments and work towards becoming debt-free.</p>
                <button 
                  className="primary-btn"
                  onClick={() => setShowDebtForm(true)}
                >
                  Add Your First Debt
                </button>
              </div>
            )}
          </div>
        )}

        {activePage === 'category' && (
          <>
            <div className="dashboard-header">
              <h1>Category Summary</h1>
              <p>View spending breakdown by categories.</p>
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
                        <td className="income">${values.income.toFixed(2)}</td>
                        <td className="expense">${values.expense.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activePage === 'reports' && (
          <>
              <div className="card">
              <h2>Export Data</h2>
              <div className="export-section">
                <div className="export-filters">
                  <div className="filter-row">
                    <input
                      type="date"
                      placeholder="Start Date"
                      onChange={(e) => setExportFilters({...exportFilters, startDate: e.target.value})}
                    />
                    <input
                      type="date"
                      placeholder="End Date"
                      onChange={(e) => setExportFilters({...exportFilters, endDate: e.target.value})}
                    />
                    <select onChange={(e) => setExportFilters({...exportFilters, type: e.target.value})}>
                      <option value="">All Types</option>
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                    <select onChange={(e) => setExportFilters({...exportFilters, category: e.target.value})}>
                      <option value="">All Categories</option>
                      {predefinedCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="export-actions">
                  <button 
                    className="primary-btn"
                    onClick={() => handleExport('csv')}
                  >
                    Export as CSV
                  </button>
                  <button 
                    className="secondary-btn"
                    onClick={() => handleExport('pdf')}
                  >
                    Export as PDF
                  </button>
                </div>
              </div>
            </div>

            <div className="dashboard-header">
              <h1>Financial Reports</h1>
              <p>Detailed monthly and yearly financial reports.</p>
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
          </>
        )}

        {activePage === 'settings' && (
          <>
            <div className="dashboard-header">
              <h1>Settings</h1>
              <p>Manage your account settings and preferences.</p>
            </div>

            <div className="card">
              <h2>Account Settings</h2>
              <p>Settings functionality coming soon...</p>
              <button 
                className="danger-btn"
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.href = '/login';
                }}
              >
                Logout
              </button>
            </div>
          </>
        )}
        
      </div>
    </div>
  );
};

export default Dashboard;