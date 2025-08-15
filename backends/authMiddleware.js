import jwt from "jsonwebtoken";
import Joi from 'joi';

const validateUser = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    age: Joi.number().integer().min(13).max(120).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const validateTransaction = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().min(1).max(100).required(),
    amount: Joi.number().positive().required(),
    type: Joi.string().valid('income', 'expense').required(),
    category: Joi.string().max(50).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const SECRET_KEY = process.env.JWT_SECRET || "yourSecretKey";

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; 

  if (!token) {
    return res.status(401).json({ 
      error: "Unauthorized",
      message: "No authentication token provided"
    });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    
    if (decoded.exp * 1000 < Date.now()) {
      return res.status(401).json({ 
        error: "Token expired",
        message: "Please login again"
      });
    }
    
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ 
      error: "Invalid token",
      message: "Authentication failed"
    });
  }
};

export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: "Forbidden",
        message: "You don't have permission to access this resource"
      });
    }
    next();
  };
};