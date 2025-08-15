import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
import cors from "cors"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";

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

<<<<<<< HEAD
=======
    // generate token
>>>>>>> 921ba539bb809ca69a1c0efa4cd1a0ab5fe70ecd
    const token = jwt.sign(
      { userId: newUser._id, name: newUser.name, email: newUser.email },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

<<<<<<< HEAD
=======
    // send token with response
>>>>>>> 921ba539bb809ca69a1c0efa4cd1a0ab5fe70ecd
    res.status(201).json({ message: "Signup successful", token });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

<<<<<<< HEAD
 
=======

const SECRET_KEY = process.env.JWT_SECRET || "yourSecretKey"; 
>>>>>>> 921ba539bb809ca69a1c0efa4cd1a0ab5fe70ecd

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