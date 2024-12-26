const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

const isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === "owner") {
    next();
  } else {
    res.status(403).json({ message: "Forbidden: Admin access only" });
  }
};

module.exports = { isAuthenticated, isAdmin };
