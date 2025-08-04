import jwt from "jsonwebtoken";

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