import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
import cors from "cors"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";
import PDFDocument from 'pdfkit';

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

;

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


const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  title: String,
  amount: Number,
  type: { type: String, enum: ["income", "expense"] },
  category: String,
  date: { type: Date, default: Date.now },
});


const TransactionModel = mongoose.model("transactions", transactionSchema);

app.post("/transactions", auth, async (req, res) => {
  try {
    const newTransaction = new TransactionModel({
      ...req.body,
      userId: req.userId
    });
    await newTransaction.save();
    res.status(201).json({ message: "Transaction added", transaction: newTransaction });
  } catch (error) {
    res.status(500).json({ error: "Failed to add transaction" });
  }
});


app.get("/transactions", auth, async (req, res) => {
  try {
    const transactions = await TransactionModel.find({ userId: req.userId });
    res.status(200).json(transactions);
  } catch (error) {
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


app.get("/transactions/export/csv", auth, async (req, res) => {
  try {
    const { startDate, endDate, type, category } = req.query;
    let query = { userId: req.userId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (type) query.type = type;
    if (category) query.category = category;
    
    const transactions = await TransactionModel.find(query).sort({ date: -1 });

    let csvContent = 'Date,Title,Amount,Type,Category\n';
    transactions.forEach(txn => {
      const date = txn.date ? new Date(txn.date).toISOString().split('T')[0] : '';

      const title = `"${txn.title.replace(/"/g, '""')}"`;
      const category = txn.category || 'Uncategorized';
      csvContent += `${date},${title},${txn.amount},${txn.type},${category}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: "Failed to export CSV" });
  }
});

// Export transactions as PDF
app.get("/transactions/export/pdf", auth, async (req, res) => {
  try {
    const { startDate, endDate, type, category } = req.query;
    let query = { userId: req.userId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (type) query.type = type;
    if (category) query.category = category;
    
    const transactions = await TransactionModel.find(query).sort({ date: -1 });
    const user = await UserModel.findById(req.userId);
    
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.pdf');
    
    doc.pipe(res);
    doc.fontSize(20).text('Financial Transactions Report', 50, 50);
    doc.fontSize(12).text(`Generated for: ${user.name}`, 50, 80);
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 50, 95);
    
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    doc.text(`Total Income: $${totalIncome.toFixed(2)}`, 50, 120);
    doc.text(`Total Expenses: $${totalExpense.toFixed(2)}`, 50, 135);
    doc.text(`Net Balance: $${(totalIncome - totalExpense).toFixed(2)}`, 50, 150);

    let yPosition = 180;
    doc.text('Date', 50, yPosition);
    doc.text('Title', 120, yPosition);
    doc.text('Amount', 300, yPosition);
    doc.text('Type', 380, yPosition);
    doc.text('Category', 450, yPosition);

    doc.moveTo(50, yPosition + 15).lineTo(550, yPosition + 15).stroke();
    yPosition += 25;

    transactions.forEach(txn => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
      
      const date = new Date(txn.date).toLocaleDateString();
      doc.fontSize(10);
      doc.text(date, 50, yPosition);
      doc.text(txn.title.substring(0, 25), 120, yPosition);
      doc.text(`$${txn.amount.toFixed(2)}`, 300, yPosition);
      doc.text(txn.type, 380, yPosition);
      doc.text(txn.category || 'N/A', 450, yPosition);
      yPosition += 15;
    });
    
    doc.end();
  } catch (error) {
    res.status(500).json({ error: "Failed to export PDF" });
  }
});