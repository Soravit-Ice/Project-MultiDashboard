// Middleware to check if user has required role
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        requiredRole: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Middleware to check if user is admin
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ 
      error: 'Access denied. Admin privileges required.' 
    });
  }

  next();
};
