import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
import cors from "cors"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";
import PDFDocument from 'pdfkit';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET || "yourSecretKey";

const app = express();


app.use(cors());

dotenv.config();

const PORT = process.env.PORT || 7000;
const MONGOURL =  process.env.MONGO_URL;

mongoose.connect(MONGOURL).then(()=>{
    console.log("Database is connected successfully.");
    app.listen(PORT, ()=>{
        console.log(`Server is running on port ${PORT}`);

    });
}).catch((error)=> console.log(error));

app.use(express.json());


const userSchema = new mongoose.Schema({
    name: String,
    age: Number,
    email: String,
    password: String,
});

const UserModel= mongoose.model("users", userSchema)

app.get("/users", async(req,res)=>{
    const userData= await UserModel.find();
    res.json(userData);
});

app.post("/users", async(req,res)=>{
    const newUser = new UserModel(req.body); 
    await newUser.save();
    res.status(201).json({ message: "User added successfully", user: newUser });

});

app.post("/signup", async (req, res) => {
  try {
    const { name, age, email, password } = req.body;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new UserModel({ name, age, email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, name: newUser.name, email: newUser.email },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.status(201).json({ message: "Signup successful", token });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

 

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, name: user.name, email: user.email },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const formatCurrency = (amount, currency = 'BDT') => {
  const num = Number(amount) || 0;
  
  const currencySymbols = {
    'BDT': '৳',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'INR': '₹',
    'JPY': '¥',
    'CNY': '¥',
    'AUD': 'A$',
    'CAD': 'C$'
  };
  
  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  title: String,
  amount: Number,
  type: { type: String, enum: ["income", "expense"] },
  category: String,
  date: { type: Date, default: Date.now, required: true },
  receipt: {
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    uploadDate: { type: Date, default: Date.now }
  }
});

const TransactionModel = mongoose.model("transactions", transactionSchema);

app.post("/transactions", auth, async (req, res) => {
  try {
    const transactionData = {
      ...req.body,
      userId: req.userId,
      date: req.body.date || new Date() 
    };
    
    const newTransaction = new TransactionModel(transactionData);
    await newTransaction.save();
    res.status(201).json({ message: "Transaction added", transaction: newTransaction });
  } catch (error) {
    console.error('Transaction creation error:', error);
    res.status(500).json({ error: "Failed to add transaction" });
  }
});


app.get("/transactions", auth, async (req, res) => {
  try {
    const transactions = await TransactionModel.find({ userId: req.userId });
    const preferences = await UserPreferencesModel.findOne({ userId: req.userId });
    const currency = preferences?.currency || 'BDT';
    
    const transactionsWithCurrency = transactions.map(transaction => ({
      ...transaction.toObject(),
      currencySymbol: currency === 'BDT' ? '৳' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : currency
    }));
    
    res.status(200).json(transactionsWithCurrency);
  } catch (error) {
    console.error('Fetch transactions error:', error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});


app.put("/transactions/:id", auth, async (req, res) => {
  try {
    const transaction = await TransactionModel.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    
    if (transaction.userId.toString() !== req.userId) {
      return res.status(403).json({ error: "Unauthorized: Not your transaction" });
    }
    
    const updatedTransaction = await TransactionModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    res.status(200).json({ message: "Transaction updated", transaction: updatedTransaction });
  } catch (error) {
    res.status(500).json({ error: "Failed to update transaction" });
  }
});


app.delete("/transactions/:id", auth, async (req, res) => {
  try {
    const transaction = await TransactionModel.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    
    if (transaction.userId.toString() !== req.userId) {
      return res.status(403).json({ error: "Unauthorized: Not your transaction" });
    }
    
    await TransactionModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Transaction deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete transaction" });
  }
});


const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  category: String,
  monthlyLimit: Number,
  alertThreshold: { type: Number, default: 80 },
  createdAt: { type: Date, default: Date.now }
});

const recurringBillSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  name: String,
  amount: Number,
  category: String,
  frequency: { type: String, enum: ['weekly', 'monthly', 'quarterly', 'yearly'] },
  nextDueDate: Date,
  reminderDays: { type: Number, default: 3 },
  isActive: { type: Boolean, default: true },
  description: String,
  lastPaidDate: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const BudgetModel = mongoose.model("budgets", budgetSchema);
const RecurringBillModel = mongoose.model("recurringbills", recurringBillSchema);

// Budget
app.post("/budgets", auth, async (req, res) => {
  try {
    const newBudget = new BudgetModel({
      ...req.body,
      userId: req.userId
    });
    await newBudget.save();
    res.status(201).json({ message: "Budget created", budget: newBudget });
  } catch (error) {
    res.status(500).json({ error: "Failed to create budget" });
  }
});

app.get("/budgets", auth, async (req, res) => {
  try {
    const budgets = await BudgetModel.find({ userId: req.userId });
    res.status(200).json(budgets);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch budgets" });
  }
});

app.delete("/budgets/:id", auth, async (req, res) => {
  try {
    const budget = await BudgetModel.findById(req.params.id);
    if (!budget || budget.userId.toString() !== req.userId) {
      return res.status(404).json({ error: "Budget not found" });
    }
    await BudgetModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Budget deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete budget" });
  }
});

// Recurring bills
app.post("/recurring-bills", auth, async (req, res) => {
  try {
    const newBill = new RecurringBillModel({
      ...req.body,
      userId: req.userId,
      updatedAt: new Date()
    });
    await newBill.save();
    res.status(201).json({ message: "Recurring bill created", bill: newBill });
  } catch (error) {
    res.status(500).json({ error: "Failed to create recurring bill" });
  }
});

app.get("/recurring-bills", auth, async (req, res) => {
  try {
    const bills = await RecurringBillModel.find({ userId: req.userId });
    res.status(200).json(bills);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recurring bills" });
  }
});

app.put("/recurring-bills/:id", auth, async (req, res) => {
  try {
    const bill = await RecurringBillModel.findById(req.params.id);
    if (!bill || bill.userId.toString() !== req.userId) {
      return res.status(404).json({ error: "Recurring bill not found" });
    }
    const updatedBill = await RecurringBillModel.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    res.status(200).json({ message: "Recurring bill updated", bill: updatedBill });
  } catch (error) {
    res.status(500).json({ error: "Failed to update recurring bill" });
  }
});

app.delete("/recurring-bills/:id", auth, async (req, res) => {
  try {
    const bill = await RecurringBillModel.findById(req.params.id);
    if (!bill || bill.userId.toString() !== req.userId) {
      return res.status(404).json({ error: "Recurring bill not found" });
    }
    await RecurringBillModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Recurring bill deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete recurring bill" });
  }
});

const debtSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  name: String,
  totalAmount: Number,
  currentBalance: Number,
  interestRate: Number,
  minimumPayment: Number,
  dueDate: Date,
  lender: String,
  debtType: { 
    type: String, 
    enum: ['credit_card', 'loan', 'mortgage', 'student_loan', 'other'],
    default: 'other'
  },
  paymentFrequency: { 
    type: String, 
    enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});


// Debt 
const DebtModel = mongoose.model("debts", debtSchema);
const debtPaymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  debtId: { type: mongoose.Schema.Types.ObjectId, ref: 'debts', required: true },
  amount: Number,
  paymentDate: { type: Date, default: Date.now },
  balanceAfter: Number,
  interestPortion: Number,
  principalPortion: Number
});

const DebtPaymentModel = mongoose.model("debtpayments", debtPaymentSchema);


app.post("/debts", auth, async (req, res) => {
  try {
    const newDebt = new DebtModel({
      ...req.body,
      userId: req.userId,
      updatedAt: new Date()
    });
    await newDebt.save();
    res.status(201).json({ message: "Debt created", debt: newDebt });
  } catch (error) {
    res.status(500).json({ error: "Failed to create debt" });
  }
});

app.get("/debts", auth, async (req, res) => {
  try {
    const debts = await DebtModel.find({ userId: req.userId });
    res.status(200).json(debts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch debts" });
  }
});

app.put("/debts/:id", auth, async (req, res) => {
  try {
    const debt = await DebtModel.findById(req.params.id);
    if (!debt || debt.userId.toString() !== req.userId) {
      return res.status(404).json({ error: "Debt not found" });
    }
    const updatedDebt = await DebtModel.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    res.status(200).json({ message: "Debt updated", debt: updatedDebt });
  } catch (error) {
    res.status(500).json({ error: "Failed to update debt" });
  }
});

app.delete("/debts/:id", auth, async (req, res) => {
  try {
    const debt = await DebtModel.findById(req.params.id);
    if (!debt || debt.userId.toString() !== req.userId) {
      return res.status(404).json({ error: "Debt not found" });
    }
    await DebtModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Debt deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete debt" });
  }
});


app.post("/debts/:id/payment", auth, async (req, res) => {
  try {
    const { amount, interestPortion, principalPortion } = req.body;
    const debt = await DebtModel.findById(req.params.id);
    
    if (!debt || debt.userId.toString() !== req.userId) {
      return res.status(404).json({ error: "Debt not found" });
    }

    const newBalance = Math.max(0, debt.currentBalance - amount);
    await DebtModel.findByIdAndUpdate(req.params.id, {
      currentBalance: newBalance,
      updatedAt: new Date()
    });

    const payment = new DebtPaymentModel({
      userId: req.userId,
      debtId: req.params.id,
      amount,
      balanceAfter: newBalance,
      interestPortion: interestPortion || 0,
      principalPortion: principalPortion || amount
    });
    await payment.save();

    const transaction = new TransactionModel({
      userId: req.userId,
      title: `${debt.name} Payment`,
      amount,
      type: 'expense',
      category: 'Debt Payment',
      date: new Date()
    });
    await transaction.save();

    res.status(200).json({ 
      message: "Payment recorded", 
      payment, 
      newBalance,
      transaction 
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to record payment" });
  }
});


app.get("/debts/:id/payments", auth, async (req, res) => {
  try {
    const debt = await DebtModel.findById(req.params.id);
    if (!debt || debt.userId.toString() !== req.userId) {
      return res.status(404).json({ error: "Debt not found" });
    }
    
    const payments = await DebtPaymentModel.find({ 
      userId: req.userId, 
      debtId: req.params.id 
    }).sort({ paymentDate: -1 });
    
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch payment history" });
  }
});



//CSV export 
app.get("/transactions/export/csv", auth, async (req, res) => {
  try {
    console.log('CSV export started for user:', req.userId);
    console.log('Query parameters:', req.query);
    
    const { startDate, endDate, type, category } = req.query;
    let query = { userId: req.userId };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (type && type !== 'all') query.type = type;
    if (category && category !== 'all') query.category = category;
    
    console.log('MongoDB query:', JSON.stringify(query));
    
    const transactions = await TransactionModel.find(query).sort({ date: -1 });
    console.log(`Found ${transactions.length} transactions`);
    
    let preferences;
    try {
      preferences = await UserPreferencesModel.findOne({ userId: req.userId });
    } catch (prefError) {
      console.warn('Could not fetch user preferences, using defaults:', prefError.message);
      preferences = null;
    }
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    transactions.forEach(txn => {
      const amount = Number(txn.amount) || 0;
      if (txn.type === 'income') {
        totalIncome += amount;
      } else if (txn.type === 'expense') {
        totalExpense += amount;
      }
    });
    
    let csvContent = 'Date,Title,Amount,Type,Category\n';
    
    if (transactions.length === 0) {
      csvContent += 'No transactions found for the selected criteria\n';
    } else {
      transactions.forEach(txn => {
        try {
          const dateObj = txn.date ? new Date(txn.date) : new Date();
          const formattedDate = !isNaN(dateObj) ? dateObj.toISOString().split('T')[0] : 'N/A';

          const title = `"${(txn.title || 'Untitled').replace(/"/g, '""')}"`;
          const categoryName = `"${(txn.category || 'Uncategorized').replace(/"/g, '""')}"`;
          const amount = Number(txn.amount) || 0;
          const type = txn.type || 'unknown';
          
          csvContent += `${formattedDate},${title},"${amount}",${type},${categoryName}\n`;
        } catch (rowError) {
          console.error('Error processing transaction row:', rowError);
          csvContent += `Error processing transaction,,,Error,\n`;
        }
      });
    }
    
    csvContent += '\nSummary\n';
    csvContent += `Total Income,,,"${totalIncome}",\n`;
    csvContent += `Total Expense,,,"${totalExpense}",\n`;
    csvContent += `Net Balance,,,"${totalIncome - totalExpense}",\n`;
    csvContent += `Export Date,,,"${new Date().toISOString()}",\n`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));
    
    console.log('CSV export completed successfully');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('CSV export error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: "Failed to export CSV", 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

//PDF export
app.get("/transactions/export/pdf", auth, async (req, res) => {
  try {
    console.log('PDF export started for user:', req.userId);
    
    const { startDate, endDate, type, category } = req.query;
    let query = { userId: req.userId };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (type && type !== 'all') query.type = type;
    if (category && category !== 'all') query.category = category;
    
    const transactions = await TransactionModel.find(query).sort({ date: -1 });
    const user = await UserModel.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log(`Found ${transactions.length} transactions for PDF`);

    let totalIncome = 0;
    let totalExpense = 0;
    
    transactions.forEach(txn => {
      const amount = Number(txn.amount) || 0;
      if (txn.type === 'income') {
        totalIncome += amount;
      } else if (txn.type === 'expense') {
        totalExpense += amount;
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.pdf"');
    
    const doc = new PDFDocument({ 
      margin: 50,
      info: {
        Title: 'Financial Transactions Report',
        Author: user.name || 'User',
        Subject: 'Financial Report',
        Keywords: 'transactions, finance, report'
      }
    });
    
    doc.on('error', (err) => {
      console.error('PDF generation error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: "PDF generation failed", message: err.message });
      }
    });

    doc.pipe(res);

    try {
      doc.font('Helvetica');
      
      const formatForPDF = (amount) => {
        const num = Number(amount) || 0;
        return num.toLocaleString('en-US', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        });
      };

      doc.fontSize(20).text('Financial Transactions Report', 50, 50);
      doc.fontSize(12);
      doc.text(`Generated for: ${user.name || 'Unknown User'}`, 50, 80);
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 50, 95);

      doc.fontSize(14).text('Summary:', 50, 140);
      doc.fontSize(12);
      
      doc.text(`Total Income: ${formatForPDF(totalIncome)}`, 70, 160);
      doc.text(`Total Expense: ${formatForPDF(totalExpense)}`, 70, 175);
      doc.text(`Net Balance: ${formatForPDF(totalIncome - totalExpense)}`, 70, 190);
      
      doc.moveTo(50, 210).lineTo(550, 210).stroke();

      if (transactions.length > 0) {
        let yPosition = 240;

        doc.fontSize(10).fillColor('black');
        doc.text('Date', 50, yPosition);
        doc.text('Title', 120, yPosition);
        doc.text('Amount', 320, yPosition);
        doc.text('Type', 420, yPosition);
        doc.text('Category', 480, yPosition);

        doc.moveTo(50, yPosition + 15).lineTo(550, yPosition + 15).stroke();
        yPosition += 25;

        transactions.forEach((txn) => {
          if (yPosition > 720) {
            doc.addPage();
            yPosition = 50;
          }
          
          const dateObj = txn.date ? new Date(txn.date) : new Date();
          const date = !isNaN(dateObj) ? dateObj.toLocaleDateString() : 'N/A';
          
          const title = (txn.title || 'Untitled').substring(0, 25);
          const amount = Number(txn.amount) || 0;
          const type = txn.type || 'N/A';
          const categoryName = (txn.category || 'Uncategorized').substring(0, 12);
          
          doc.fontSize(9);
          doc.text(date, 50, yPosition);
          doc.text(title, 120, yPosition);
          doc.text(formatForPDF(amount), 320, yPosition);
          doc.text(type, 420, yPosition);
          doc.text(categoryName, 480, yPosition);
          yPosition += 15;
        });
        
        if (yPosition > 680) {
          doc.addPage();
          yPosition = 50;
        }
        
        yPosition += 20;
        doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
        yPosition += 15;
        
        doc.fontSize(11).fillColor('black');
        doc.text('Final Summary:', 50, yPosition);
        yPosition += 20;
        doc.fontSize(10);
        doc.text(`Total Income: ${formatForPDF(totalIncome)}`, 70, yPosition);
        yPosition += 15;
        doc.text(`Total Expense: ${formatForPDF(totalExpense)}`, 70, yPosition);
        yPosition += 15;
        doc.text(`Net Balance: ${formatForPDF(totalIncome - totalExpense)}`, 70, yPosition);
        
      } else {
        doc.fontSize(12).text('No transactions found for the selected criteria.', 50, 240);
      }

      console.log('PDF export completed successfully');
      doc.end();
      
    } catch (pdfContentError) {
      console.error('PDF content generation error:', pdfContentError);
      doc.end();
      throw pdfContentError;
    }
    
  } catch (error) {
    console.error('PDF export error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: "Failed to export PDF", 
        message: error.message
      });
    }
  }
});

//Tax calculation function
const taxEstimationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  taxYear: { type: String, required: true },
  totalIncome: { type: Number, required: true },
  taxableIncome: { type: Number, required: true },
  totalTax: { type: Number, required: true },
  exemptions: {
    basic: { type: Number, default: 350000 },
    investment: { type: Number, default: 0 },
    donation: { type: Number, default: 0 },
    disability: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  taxBreakdown: [{
    slabRate: Number,
    slabIncome: Number,
    taxAmount: Number
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const TaxEstimationModel = mongoose.model("taxestimations", taxEstimationSchema);

const calculateBangladeshTax = (totalIncome, exemptions = {}) => {
  const income = Number(totalIncome) || 0;
  
  const {
    basic = 350000,
    investment = 0,
    donation = 0,
    disability = 0,
    other = 0
  } = exemptions;

  const totalExemption = Number(basic) + Number(investment) + Number(donation) + Number(disability) + Number(other);
  const taxableIncome = Math.max(0, income - totalExemption);

  const taxSlabs = [
    { min: 0, max: 350000, rate: 0 },
    { min: 350000, max: 450000, rate: 5 },
    { min: 450000, max: 750000, rate: 10 },
    { min: 750000, max: 1150000, rate: 15 },
    { min: 1150000, max: 1650000, rate: 20 },
    { min: 1650000, max: Infinity, rate: 25 }
  ];

  let totalTax = 0;
  let taxBreakdown = [];
  let remainingIncome = taxableIncome;

  for (let slab of taxSlabs) {
    if (remainingIncome <= 0) break;
    
    const slabIncome = Math.min(remainingIncome, slab.max - slab.min);
    const taxAmount = slabIncome * (slab.rate / 100);
    
    if (taxAmount > 0) {
      taxBreakdown.push({
        slabRate: slab.rate,
        slabIncome: slabIncome,
        taxAmount: taxAmount
      });
    }
    
    totalTax += taxAmount;
    remainingIncome -= slabIncome;
  }

  return {
    totalIncome: income,
    taxableIncome: taxableIncome,
    totalTax: totalTax,
    exemptions: {
      basic: Number(basic),
      investment: Number(investment),
      donation: Number(donation),
      disability: Number(disability),
      other: Number(other)
    },
    taxBreakdown: taxBreakdown
  };
};

// Tax estimation routes
app.post("/tax-estimation", auth, async (req, res) => {
  try {
    const { totalIncome, exemptions, taxYear } = req.body;
    
    const calculation = calculateBangladeshTax(totalIncome, exemptions);
    
    const newEstimation = new TaxEstimationModel({
      userId: req.userId,
      taxYear: taxYear || new Date().getFullYear().toString(),
      ...calculation
    });
    
    await newEstimation.save();
    res.status(201).json({ message: "Tax estimation saved", estimation: newEstimation });
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate tax estimation" });
  }
});

app.get("/tax-estimation", auth, async (req, res) => {
  try {
    const estimations = await TaxEstimationModel.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.status(200).json(estimations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tax estimations" });
  }
});

app.get("/tax-estimation/calculate", auth, async (req, res) => {
  try {
    const { totalIncome, basicExemption, investment, donation, disability, other } = req.query;
    
    const exemptions = {
      basic: Number(basicExemption) || 350000,
      investment: Number(investment) || 0,
      donation: Number(donation) || 0,
      disability: Number(disability) || 0,
      other: Number(other) || 0
    };
    
    const calculation = calculateBangladeshTax(Number(totalIncome), exemptions);
    res.status(200).json(calculation);
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate tax" });
  }
}); 

const uploadDir = 'uploads/receipts';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `receipt-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files and PDFs are allowed'));
    }
  }
});

// Serve static files
app.use('/uploads', express.static('uploads'));

// Upload receipt with transaction
app.post("/transactions/with-receipt", auth, upload.single('receipt'), async (req, res) => {
  try {
    const transactionData = {
      ...req.body,
      userId: req.userId
    };

    if (req.file) {
      transactionData.receipt = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size
      };
    }

    const newTransaction = new TransactionModel(transactionData);
    await newTransaction.save();
    res.status(201).json({ message: "Transaction with receipt added", transaction: newTransaction });
  } catch (error) {
    // Clean up uploaded file if transaction creation fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: "Failed to add transaction with receipt" });
  }
});

// Add receipt to existing transaction
app.post("/transactions/:id/receipt", auth, upload.single('receipt'), async (req, res) => {
  try {
    const transaction = await TransactionModel.findById(req.params.id);
    
    if (!transaction || transaction.userId.toString() !== req.userId) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Delete old receipt if exists
    if (transaction.receipt && transaction.receipt.path) {
      if (fs.existsSync(transaction.receipt.path)) {
        fs.unlinkSync(transaction.receipt.path);
      }
    }

    transaction.receipt = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      uploadDate: new Date()
    };

    await transaction.save();
    res.status(200).json({ message: "Receipt uploaded", transaction });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Failed to upload receipt" });
  }
});

// Delete receipt
app.delete("/transactions/:id/receipt", auth, async (req, res) => {
  try {
    const transaction = await TransactionModel.findById(req.params.id);
    
    if (!transaction || transaction.userId.toString() !== req.userId) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (transaction.receipt && transaction.receipt.path) {
      if (fs.existsSync(transaction.receipt.path)) {
        fs.unlinkSync(transaction.receipt.path);
      }
      transaction.receipt = undefined;
      await transaction.save();
    }

    res.status(200).json({ message: "Receipt deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete receipt" });
  }
});


// User preference and settings part
const userPreferencesSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true, unique: true },
  currency: { type: String, default: 'BDT' },
  dateFormat: { type: String, default: 'DD/MM/YYYY' },
  numberFormat: { type: String, default: '1,234.56' },
  theme: { type: String, default: 'light' },
  notifications: {
    budgetAlerts: { type: Boolean, default: true },
    billReminders: { type: Boolean, default: true },
    monthlyReports: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: false }
  },
  autoLogout: { type: Number, default: 30 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const UserPreferencesModel = mongoose.model("userpreferences", userPreferencesSchema);

const customCategorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['income', 'expense', 'both'], default: 'expense' },
  color: { type: String, default: '#007bff' },
  icon: { type: String, default: '💰' },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const CustomCategoryModel = mongoose.model("customcategories", customCategorySchema);
app.get("/user/preferences", auth, async (req, res) => {
  try {
    let preferences = await UserPreferencesModel.findOne({ userId: req.userId });
    
    if (!preferences) {
      preferences = new UserPreferencesModel({ 
        userId: req.userId,
        currency: 'BDT' 
      });
      await preferences.save();
    }
    
    res.status(200).json(preferences);
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});
app.put("/user/preferences", auth, async (req, res) => {
  try {
    const updatedPreferences = await UserPreferencesModel.findOneAndUpdate(
      { userId: req.userId },
      { 
        ...req.body, 
        updatedAt: new Date() 
      },
      { new: true, upsert: true }
    );
    
    res.status(200).json({ 
      message: "Preferences updated successfully", 
      preferences: updatedPreferences 
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: "Failed to update preferences" });
  }
});
app.put("/user/profile", auth, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: "Name is required" });
    }
    
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.userId,
      { name: name.trim() },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
  const { password, ...userWithoutPassword } = updatedUser.toObject();
    res.status(200).json({ 
      message: "Profile updated successfully", 
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});
app.put("/user/password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both current and new passwords are required" });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long" });
    }
    
    const user = await UserModel.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }
    
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await UserModel.findByIdAndUpdate(req.userId, { password: hashedNewPassword });
    
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: "Failed to update password" });
  }
});
app.get("/user/categories", auth, async (req, res) => {
  try {
    const categories = await CustomCategoryModel.find({ userId: req.userId }).sort({ name: 1 });
    res.status(200).json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});
app.post("/user/categories", auth, async (req, res) => {
  try {
    const { name, type, color, icon } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: "Category name is required" });
    }
        const existingCategory = await CustomCategoryModel.findOne({ 
      userId: req.userId, 
      name: name.trim() 
    });
    
    if (existingCategory) {
      return res.status(400).json({ error: "Category already exists" });
    }
    
    const newCategory = new CustomCategoryModel({
      userId: req.userId,
      name: name.trim(),
      type: type || 'expense',
      color: color || '#007bff',
      icon: icon || '💰'
    });
    
    await newCategory.save();
    res.status(201).json({ message: "Category added successfully", category: newCategory });
  } catch (error) {
    console.error('Add category error:', error);
    res.status(500).json({ error: "Failed to add category" });
  }
});
app.put("/user/categories/:id", auth, async (req, res) => {
  try {
    const category = await CustomCategoryModel.findById(req.params.id);
    
    if (!category || category.userId.toString() !== req.userId) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    const updatedCategory = await CustomCategoryModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    res.status(200).json({ message: "Category updated successfully", category: updatedCategory });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: "Failed to update category" });
  }
});
app.delete("/user/categories/:id", auth, async (req, res) => {
  try {
    const category = await CustomCategoryModel.findById(req.params.id);
    
    if (!category || category.userId.toString() !== req.userId) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    await CustomCategoryModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});
app.get("/user/export-data", auth, async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId).select('-password');
    const transactions = await TransactionModel.find({ userId: req.userId });
    const budgets = await BudgetModel.find({ userId: req.userId });
    const bills = await RecurringBillModel.find({ userId: req.userId });
    const debts = await DebtModel.find({ userId: req.userId });
    const preferences = await UserPreferencesModel.findOne({ userId: req.userId });
    const categories = await CustomCategoryModel.find({ userId: req.userId });
    
    const exportData = {
      user,
      transactions,
      budgets,
      bills,
      debts,
      preferences,
      categories,
      exportDate: new Date().toISOString()
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="financial-data-export.json"');
    res.json(exportData);
  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({ error: "Failed to export data" });
  }
});
app.delete("/user/clear-data", auth, async (req, res) => {
  try {
    await Promise.all([
      TransactionModel.deleteMany({ userId: req.userId }),
      BudgetModel.deleteMany({ userId: req.userId }),
      RecurringBillModel.deleteMany({ userId: req.userId }),
      DebtModel.deleteMany({ userId: req.userId }),
      DebtPaymentModel.deleteMany({ userId: req.userId }),
      TaxEstimationModel.deleteMany({ userId: req.userId }),
      CustomCategoryModel.deleteMany({ userId: req.userId })
    ]);
    
    res.status(200).json({ message: "All data cleared successfully" });
  } catch (error) {
    console.error('Clear data error:', error);
    res.status(500).json({ error: "Failed to clear data" });
  }
});
app.delete("/user/account", auth, async (req, res) => {
  try {
    await Promise.all([
      TransactionModel.deleteMany({ userId: req.userId }),
      BudgetModel.deleteMany({ userId: req.userId }),
      RecurringBillModel.deleteMany({ userId: req.userId }),
      DebtModel.deleteMany({ userId: req.userId }),
      DebtPaymentModel.deleteMany({ userId: req.userId }),
      TaxEstimationModel.deleteMany({ userId: req.userId }),
      UserPreferencesModel.deleteMany({ userId: req.userId }),
      CustomCategoryModel.deleteMany({ userId: req.userId })
    ]);
    
    await UserModel.findByIdAndDelete(req.userId);
    
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

app.get("/user/profile", auth, async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});