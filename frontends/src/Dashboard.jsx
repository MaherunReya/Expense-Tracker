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
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const [settings, setSettings] = useState({
    currency: localStorage.getItem('currency') || 'BDT',
    dateFormat: localStorage.getItem('dateFormat') || 'DD/MM/YYYY',
    numberFormat: localStorage.getItem('numberFormat') || '1,234.56',
    autoLogout: localStorage.getItem('autoLogout') || '30',
    notifications: {
      budgetAlerts: localStorage.getItem('budgetAlerts') !== 'false',
      billReminders: localStorage.getItem('billReminders') !== 'false',
      monthlyReports: localStorage.getItem('monthlyReports') !== 'false',
      emailNotifications: localStorage.getItem('emailNotifications') === 'true'
    }
  });

  const formatCurrency = (amount) => {
    const currencySymbols = {
      'BDT': '৳',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'INR': '₹'
    };
    
    const symbol = currencySymbols[settings.currency] || '৳';
    
    let formattedAmount;
    if (settings.numberFormat === '1,234.56') {
      formattedAmount = amount.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    } else {
      formattedAmount = amount.toFixed(2);
    }
    
    return `${symbol}${formattedAmount}`;
  };

const handleSettingsChange = (key, value) => {
  setSettings(prev => ({ ...prev, [key]: value }));
  localStorage.setItem(key, value);
  fetchTransactions(); 
};

  const handleNotificationChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
    localStorage.setItem(key, value);
  };
  const formatDate = (dateString) => {
  const date = new Date(dateString);
  if (!dateString || isNaN(date)) return 'Invalid Date';
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  switch(settings.dateFormat) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    default:
      return `${day}/${month}/${year}`;
  }
};

  const [budgets, setBudgets] = useState([]);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [budgetFormData, setBudgetFormData] = useState({
    category: '',
    monthlyLimit: '',
    alertThreshold: 80
  });

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
    { value: 'daily', label: 'Daily' },
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
      loadTaxEstimations(); 
    } catch (error) {
      console.error('Authentication error:', error);
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }, [token]);

  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        document.body.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      };
      
      document.body.setAttribute('data-theme', mediaQuery.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handleChange);
      
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

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

  const getNextDueDate = (lastDate, frequency) => {
    const date = new Date(lastDate);
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
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
          isOverdue: false
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
      
      alert(`Bill "${bill.name}" marked as paid for ${formatCurrency(bill.amount)}. Next due date: ${nextDue}`);
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      alert('Failed to mark bill as paid. Please try again.');
    }
  };

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

  const handleBudgetFormChange = (e) => {
    setBudgetFormData({ ...budgetFormData, [e.target.name]: e.target.value });
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    
    try {
      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append('title', formData.title);
        uploadData.append('amount', formData.amount);
        uploadData.append('type', formData.type);
        uploadData.append('category', formData.category);
        uploadData.append('receipt', selectedFile);
                
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        };
        
        if (editId) {
          await axios.put(`${API_URL}/transactions/${editId}`, {
            title: formData.title,
            amount: formData.amount,
            type: formData.type,
            category: formData.category
          }, { headers: { Authorization: `Bearer ${token}` } });
          
          await uploadReceipt(editId, selectedFile);
        } else {
          await axios.post(`${API_URL}/transactions/with-receipt`, uploadData, config);
        }
      } else {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        
        if (editId) {
          await axios.put(`${API_URL}/transactions/${editId}`, formData, config);
        } else {
          await axios.post(`${API_URL}/transactions`, {
            ...formData,
            date: new Date().toISOString()
          }, config);
        }
      }

      setFormData({ title: '', amount: '', type: 'income', category: '' });
      setSelectedFile(null);
      setEditId(null);
      fetchTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Failed to save transaction');
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

  const renderBarChart = () => (
    <div className="chart-container">
      <h3 className="chart-title">Monthly Income vs Expenses</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={prepareChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => formatCurrency(value)} />
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
            <Tooltip formatter={(value) => formatCurrency(value)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pie-legend">
          {categoryData.map((item, index) => (
            <div key={index} className="legend-item">
              <div 
                className="legend-color"
                data-color={item.color}
              ></div>
              <span className="legend-text">{item.name}: {formatCurrency(item.value)}</span>
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
              name === 'balance' ? formatCurrency(value) : `${value}%`,
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
              <Tooltip formatter={(value) => formatCurrency(value)} />
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
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error('No authentication token found');
    }

    const params = new URLSearchParams();
    if (exportFilters.startDate) params.append('startDate', exportFilters.startDate);
    if (exportFilters.endDate) params.append('endDate', exportFilters.endDate);
    if (exportFilters.type) params.append('type', exportFilters.type);
    if (exportFilters.category) params.append('category', exportFilters.category);

    const url = `${API_URL}/transactions/export/${format}?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Export failed: ${response.status}`);
    }

    const blob = await response.blob();
    
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.${format}`;
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    }, 100);
    
  } catch (error) {
    console.error('Export error:', error);
    alert(`Failed to export data: ${error.message}`);
  }
};

  const [showTaxForm, setShowTaxForm] = useState(false);
  const [taxResult, setTaxResult] = useState(null);
  const [taxEstimations, setTaxEstimations] = useState([]);
  const [taxFormData, setTaxFormData] = useState({
    totalIncome: '',
    basicExemption: 350000,
    investment: '',
    donation: '',
    disability: '',
    other: '',
    taxYear: new Date().getFullYear().toString()
  });

  const loadTaxEstimations = async () => {
    try {
      const res = await axios.get(`${API_URL}/tax-estimation`, config);
      setTaxEstimations(res.data);
    } catch (error) {
      console.error('Error loading tax estimations:', error);
    }
  };

  const calculateTax = async () => {
    if (!taxFormData.totalIncome) {
      alert('Please enter total income');
      return;
    }

    try {
      const params = new URLSearchParams({
        totalIncome: taxFormData.totalIncome || 0,
        basicExemption: taxFormData.basicExemption || 350000,
        investment: taxFormData.investment || 0,
        donation: taxFormData.donation || 0,
        disability: taxFormData.disability || 0,
        other: taxFormData.other || 0
      });
      
      const res = await axios.get(`${API_URL}/tax-estimation/calculate?${params}`, config);
      setTaxResult(res.data);
    } catch (error) {
      console.error('Error calculating tax:', error);
      alert('Failed to calculate tax. Please try again.');
    }
  };

  const saveTaxEstimation = async () => {
    if (!taxResult) return;
    
    try {
      await axios.post(`${API_URL}/tax-estimation`, {
        ...taxResult,
        taxYear: taxFormData.taxYear
      }, config);
      
      setTaxFormData({
        totalIncome: '', basicExemption: 350000, investment: '',
        donation: '', disability: '', other: '', taxYear: new Date().getFullYear().toString()
      });
      setTaxResult(null);
      setShowTaxForm(false);
      await loadTaxEstimations();
    } catch (error) {
      console.error('Error saving tax estimation:', error);
    }
  };

  const handleTaxFormChange = (e) => {
    setTaxFormData({ ...taxFormData, [e.target.name]: e.target.value });
  };

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const uploadReceipt = async (transactionId, file) => {
    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const response = await axios.post(
        `${API_URL}/transactions/${transactionId}/receipt`,
        formData,
        {
          ...config,
          headers: {
            ...config.headers,
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        }
      );
      
      fetchTransactions(); 
      return response.data;
    } catch (error) {
      console.error('Receipt upload error:', error);
      throw error;
    }
  };

  const deleteReceipt = async (transactionId) => {
    try {
      await axios.delete(`${API_URL}/transactions/${transactionId}/receipt`, config);
      fetchTransactions();
      alert('Receipt deleted successfully');
    } catch (error) {
      console.error('Receipt deletion error:', error);
      alert('Failed to delete receipt');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div class="sidebar-header">
          <div className="logo-container" onClick={() => window.location.href = '/'} style={{cursor: 'pointer'}}>
            <h2>Midoru</h2>
          </div>
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
              className={activePage === 'tax' ? 'active' : ''} 
              onClick={() => setActivePage('tax')}
            >
              Tax Estimation
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
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }}
            >
              Logout
            </button>
            <button 
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
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
                <p>{formatCurrency(totalIncome)}</p>
              </div>
              <div className="summary-card expense-card">
                <h3>Total Expense</h3>
                <p>{formatCurrency(totalExpense)}</p>  
              </div>
              <div className="summary-card balance-card">
                <h3>Balance</h3>
                 <p>{formatCurrency(totalIncome - totalExpense)}</p>
              </div>
              <div className="summary-card bills-card">
                <h3>Upcoming Bills</h3>
                <p>{formatCurrency(getUpcomingBillsTotal())}</p>
                <small>Next 30 days</small>
              </div>
              <div className="summary-card debt-card">
                <h3>Total Debt</h3>
                <p>{formatCurrency(getTotalDebt())}</p>
              </div>
            </div>

            {/* Budget alerts */}
            {budgetAlerts.length > 0 && (
              <div className="budget-alerts-container">
                <h2>Budget Alerts</h2>
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
                        <p>Spent: {formatCurrency(alert.spent)} of {formatCurrency(alert.limit)}</p>                        
                        <p className="alert-percentage">{alert.percentage}% used</p>
                          {alert.type === 'over' && (
                            <p className="over-budget">Over budget by {formatCurrency(alert.spent - alert.limit)}</p>
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
                        <p className="bill-amount">{formatCurrency(bill.amount)}</p>
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
                        <td className={txn.type}>{formatCurrency(txn.amount)}</td> 
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
                              <span>{formatCurrency(spent)} / {formatCurrency(budget.monthlyLimit)}</span>                           
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
                         <div className="bill-amount">{formatCurrency(bill.amount)}</div>
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
                        <div className="debt-balance">{formatCurrency(debt.currentBalance)}</div>
                        <div className="debt-original">of {formatCurrency(debt.totalAmount)}</div>                        
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
                        <td className="income"><p>{formatCurrency(totalIncome)}</p>{formatCurrency(values.income)}</td>
                        <td className="expense"><p>{formatCurrency(totalIncome)}</p>{formatCurrency(values.expense)}</td>
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
                          <td className="income">{formatCurrency(values.income)}</td>
                          <td className="expense">{formatCurrency(values.expense)}</td>
                          <td>{formatCurrency(values.income - values.expense)}</td>
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
                          <td className="income">{formatCurrency(values.income)}</td>
                          <td className="expense">{formatCurrency(values.expense)}</td>
                          <td>{formatCurrency(values.income - values.expense)}</td>                        </tr>
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
                          <div className="bill-amount">{formatCurrency(bill.amount)}</div>                            {bill.category && (
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
                <h2>Budget Alerts</h2>
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
                        <p>Spent: {formatCurrency(alert.spent)} of {formatCurrency(alert.limit)}</p>                        
                        <p className="alert-percentage">{alert.percentage}% used</p>
                          {alert.type === 'over' && (
                            <p className="over-budget">Over budget by {formatCurrency(alert.spent - alert.limit)}</p>
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
                      placeholder="Monthly Limit "
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
                                <span> {formatCurrency(spent)} / {formatCurrency(budget.monthlyLimit)}</span>                              
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
                              Over by {formatCurrency(spent - budget.monthlyLimit)}
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
                <div className="form-group">
                    <label>Receipt (optional)</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileSelect}
                      className="file-input"
                    />
                    {selectedFile && (
                      <div className="file-preview">
                        <span>{selectedFile.name}</span>
                        <button type="button" onClick={() => setSelectedFile(null)}>×</button>
                      </div>
                    )}
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
                      <th>Date</th>
                      <th>Type</th>
                      <th>Category</th>
                      <th>Receipt</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => (
                      <tr key={txn._id}>
                        <td>{txn.title}</td>
                        <td className={txn.type}>{formatCurrency(txn.amount)}</td> 
                        <td>{formatDate(txn.date)}</td>                       
                        <td>
                          <span className={`type-badge ${txn.type}`}>
                            {txn.type}
                          </span>
                        </td>
                        <td>{txn.category || 'Uncategorized'}</td>
                       <td>
                    {txn.receipt ? (
                      <div className="receipt-info">
                        <a 
                          href={`${API_URL}/${txn.receipt.path}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="receipt-link"
                          onClick={(e) => {
                            fetch(`${API_URL}/${txn.receipt.path}`, { method: 'HEAD' })
                              .then(response => {
                                if (!response.ok) {
                                  e.preventDefault();
                                  alert('Receipt file not found or unavailable');
                                }
                              })
                              .catch(() => {
                                e.preventDefault();
                                alert('Error accessing receipt');
                              });
                          }}
                        >
                          View Receipt
                        </a>
                        <button
                          className="icon-btn delete-receipt"
                          onClick={(e) => {
                            e.preventDefault();
                            if (confirm('Delete this receipt?')) {
                              deleteReceipt(txn._id);
                            }
                          }}
                          title="Delete receipt"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <div className="no-receipt">
                        <span className="no-receipt-text">No receipt</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              uploadReceipt(txn._id, file);
                            }
                          }}
                          className="receipt-upload"
                        />
                      </div>
                    )}
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
                        <div className="debt-balance">{formatCurrency(debt.currentBalance)}</div>
                        <div className="debt-original">of {formatCurrency(debt.totalAmount)}</div>
                          
                          {debt.lender && (
                            <div className="debt-lender">{debt.lender}</div>
                          )}
                          
                          {debt.interestRate > 0 && (
                            <div className="debt-rate">{debt.interestRate}% APR</div>
                          )}
                          
                          {debt.minimumPayment > 0 && (
                            <div className="debt-payment">
                              Min: {formatCurrency(debt.minimumPayment)}/{debt.paymentFrequency}
                            </div>                          
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

        {activePage === 'tax' && (
            <>
            <div className="dashboard-header">
              <h1>Tax Estimation Tool</h1>
              <p>Calculate your income tax based on Bangladesh tax laws</p>
            </div>

            <div className="card tax-calculator">
              <div className="tax-header">
                <h2>Income Tax Calculator</h2>
                <button 
                  className="primary-btn"
                  onClick={() => setShowTaxForm(!showTaxForm)}
                >
                  {showTaxForm ? 'Cancel' : 'New Calculation'}
                </button>
              </div>

              {showTaxForm && (
                <div className="tax-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Total Annual Income *</label>
                      <input
                        type="number"
                        name="totalIncome"
                        value={taxFormData.totalIncome}
                        placeholder="Enter your total income"
                        onChange={handleTaxFormChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Tax Year</label>
                      <input
                        type="text"
                        name="taxYear"
                        value={taxFormData.taxYear}
                        onChange={handleTaxFormChange}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Basic Exemption</label>
                      <select name="basicExemption" value={taxFormData.basicExemption} onChange={handleTaxFormChange}>
                        <option value="350000">General Taxpayer (3.5 Lac)</option>
                        <option value="400000">Female/Senior Citizen (4 Lac)</option>
                        <option value="475000">Disabled Person (4.75 Lac)</option>
                        <option value="400000">Gazetted War Veteran (4 Lac)</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Investment Allowance</label>
                      <input
                        type="number"
                        name="investment"
                        value={taxFormData.investment}
                        placeholder="Max 25% of income or 15 Lac"
                        onChange={handleTaxFormChange}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Donation Allowance</label>
                      <input
                        type="number"
                        name="donation"
                        value={taxFormData.donation}
                        placeholder="Charitable donations"
                        onChange={handleTaxFormChange}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Other Allowances</label>
                      <input
                        type="number"
                        name="other"
                        value={taxFormData.other}
                        placeholder="Other deductible allowances"
                        onChange={handleTaxFormChange}
                      />
                    </div>
                  </div>
                  
                  <div className="form-actions">
                    <button type="button" className="primary-btn" onClick={calculateTax}>
                      Calculate Tax
                    </button>
                  </div>
                </div>
          )}

          {taxResult && (
              <div className="tax-result">
                <h3>Tax Calculation Result</h3>
                <div className="result-summary">
                  <div className="result-item">
                    <label>Total Income:</label>
                    <span>{formatCurrency(taxResult.totalIncome || 0)}</span>
                  </div>
                  <div className="result-item">
                    <label>Taxable Income:</label>
                    <span>{formatCurrency(taxResult.taxableIncome || 0)}</span>              
                    </div>
                  <div className="result-item total-tax">
                    <label>Total Tax Payable:</label>
                    <span>{formatCurrency(taxResult.totalTax || 0)}</span>             
                </div>
                </div>
                
                {taxResult.taxBreakdown && taxResult.taxBreakdown.length > 0 && (
                  <div className="tax-breakdown">
                    <h4>Tax Breakdown by Slabs:</h4>
                    <table>
                      <thead>
                        <tr>
                          <th>Tax Rate</th>
                          <th>Taxable Amount</th>
                          <th>Tax Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {taxResult.taxBreakdown.map((slab, index) => (
                          <tr key={index}>
                            <td>{slab.slabRate || 0}%</td>
                            <td>{formatCurrency(slab.slabIncome || 0)}</td>
                            <td>{formatCurrency(slab.taxAmount || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                <button className="secondary-btn" onClick={saveTaxEstimation}>
                  Save Estimation
                </button>
              </div>
            )}

            {taxEstimations.length > 0 && (
              <div className="saved-estimations">
                <h3>Saved Tax Estimations</h3>
                <div className="estimations-list">
                  {taxEstimations.slice(0, 5).map(estimation => (
                    <div key={estimation._id} className="estimation-card">
                      <div className="estimation-header">
                        <h4>Tax Year {estimation.taxYear || 'Unknown'}</h4>
                        <span className="estimation-date">
                          {new Date(estimation.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="estimation-details">
                        <p>Income: {formatCurrency(estimation.totalIncome || 0)}</p>
                        <p>Tax: {formatCurrency(estimation.totalTax || 0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
                </div>
              </>
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
                            <td className="income">{formatCurrency(values.income)}</td>
                            <td className="expense">{formatCurrency(values.expense)}</td>
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
                    className="secondary-btn"
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
                        <td className="income">{formatCurrency(values.income)}</td>
                        <td className="expense">{formatCurrency(values.expense)}</td>
                        <td>{formatCurrency(values.income - values.expense)}</td>
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
                        <td className="income">{formatCurrency(values.income)}</td>
                        <td className="expense">{formatCurrency(values.expense)}</td>
                        <td>{formatCurrency(values.income - values.expense)}</td>
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

            {/* Profile Settings */}
            <div className="card">
              <div className="settings-header">
                <h2>Profile Settings</h2>
              </div>
              <form className="settings-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      defaultValue={user?.name || ''}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      defaultValue={user?.email || ''}
                      placeholder="Enter your email"
                      disabled
                    />
                    <small className="form-hint">Email cannot be changed</small>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="primary-btn">
                    Update Profile
                  </button>
                </div>
              </form>
            </div>

            {/* Currency & Display Settings */}
           <form className="settings-form" onSubmit={(e) => {
              e.preventDefault();
              alert('Preferences saved successfully!');
            }}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Default Currency</label>
                  <select 
                    value={settings.currency}
                    onChange={(e) => handleSettingsChange('currency', e.target.value)}
                  >
                    <option value="BDT">Bangladeshi Taka (৳)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="GBP">British Pound (£)</option>
                    <option value="INR">Indian Rupee (₹)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date Format</label>
                  <select 
                    value={settings.dateFormat}
                    onChange={(e) => handleSettingsChange('dateFormat', e.target.value)}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Number Format</label>
                  <select 
                    value={settings.numberFormat}
                    onChange={(e) => handleSettingsChange('numberFormat', e.target.value)}
                  >
                    <option value="1,234.56">1,234.56</option>
                    <option value="1.234,56">1.234,56</option>
                    <option value="1 234.56">1 234.56</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Dashboard Theme</label>
                  <select 
                    value={theme} 
                    onChange={(e) => setTheme(e.target.value)}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="primary-btn">
                  Save Preferences
                </button>
              </div>
            </form>
            {/* Privacy & Security */}
            <div className="card">
              <div className="settings-header">
                <h2>Privacy & Security</h2>
              </div>
              <div className="settings-form">
                <div className="security-section">
                  <h4>Change Password</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Current Password</label>
                      <input
                        type="password"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                  <button type="button" className="secondary-btn">
                    Update Password
                  </button>
                </div>

                <div className="security-section">
                  <h4>Data Privacy</h4>
                  <div className="privacy-options">
                    <div className="privacy-item">
                      <div className="privacy-info">
                        <h5>Data Export</h5>
                        <p>Download all your financial data</p>
                      </div>
                      <button type="button" className="secondary-btn">
                        Export Data
                      </button>
                    </div>
                    
                    <div className="privacy-item">
                      <div className="privacy-info">
                        <h5>Auto-logout</h5>
                        <p>Automatically logout after inactivity</p>
                      </div>
                      <select defaultValue="30">
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                        <option value="0">Never</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Management */}
            <div className="card">
              <div className="settings-header">
                <h2>Category Management</h2>
              </div>
              <div className="settings-form">
                <h4>Custom Categories</h4>
                <p className="settings-description">
                  Manage your transaction categories. You can add custom categories or modify existing ones.
                </p>
                
                <div className="category-list">
                  {predefinedCategories.map(category => (
                    <div key={category} className="category-item">
                      <span className="category-name">{category}</span>
                      <div className="category-actions">
                        <button className="icon-btn edit" title="Edit category">
                          Edit
                        </button>
                        <button className="icon-btn delete" title="Delete category">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="add-category">
                  <input
                    type="text"
                    placeholder="Add new category"
                    className="category-input"
                  />
                  <button type="button" className="primary-btn">
                    Add Category
                  </button>
                </div>
              </div>
            </div>

            {/* Backup & Sync */}
            <div className="card">
              <div className="settings-header">
                <h2>Backup & Sync</h2>
              </div>
              <div className="settings-form">
                <div className="backup-section">
                  <div className="backup-info">
                    <h4>Automatic Backup</h4>
                    <p>Your data is automatically backed up daily. Last backup: {new Date().toLocaleDateString()}</p>
                  </div>
                  
                  <div className="backup-actions">
                    <button type="button" className="secondary-btn">
                      Create Backup Now
                    </button>
                    <button type="button" className="secondary-btn">
                      Restore from Backup
                    </button>
                  </div>
                </div>

                <div className="sync-section">
                  <h4>Data Sync Status</h4>
                  <div className="sync-status">
                    <span className="sync-indicator online">●</span>
                    <span>All data synced</span>
                  </div>
                </div>
              </div>
            </div>

            {/* App Information */}
            <div className="card">
              <div className="settings-header">
                <h2>About</h2>
              </div>
              <div className="settings-form">
                <div className="app-info">
                  <div className="info-item">
                    <label>App Version:</label>
                    <span>1.0.0</span>
                  </div>
                  <div className="info-item">
                    <label>Last Updated:</label>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="info-item">
                    <label>Total Transactions:</label>
                    <span>{transactions.length}</span>
                  </div>
                  <div className="info-item">
                    <label>Member Since:</label>
                    <span>January 2024</span>
                  </div>
                </div>

                <div className="app-links">
                  <button type="button" className="link-btn">
                    Privacy Policy
                  </button>
                  <button type="button" className="link-btn">
                    Terms of Service
                  </button>
                  <button type="button" className="link-btn">
                    Contact Support
                  </button>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="card danger-zone">
              <div className="settings-header">
                <h2>Danger Zone</h2>
              </div>
              <div className="settings-form">
                <div className="danger-actions">
                  <div className="danger-item">
                    <div className="danger-info">
                      <h4>Clear All Data</h4>
                      <p>This will permanently delete all your transactions, budgets, and bills.</p>
                    </div>
                    <button type="button" className="danger-btn">
                      Clear Data
                    </button>
                  </div>
                  
                  <div className="danger-item">
                    <div className="danger-info">
                      <h4>Delete Account</h4>
                      <p>Permanently delete your account and all associated data.</p>
                    </div>
                    <button type="button" className="danger-btn">
                      Delete Account
                    </button>
                  </div>
                  
                  <div className="danger-item">
                    <div className="danger-info">
                      <h4>Logout</h4>
                      <p>Sign out of your account on this device.</p>
                    </div>
                    <button 
                      type="button"
                      className="secondary-btn"
                      onClick={() => {
                        localStorage.removeItem('token');
                        window.location.href = '/login';
                      }}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
      </div>
    </div>
  );
};

export default Dashboard;