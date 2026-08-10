import type { Request, Response, NextFunction } from "express";

// Auth middleware for local auth
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Role-based authorization middleware (Admin has super-user access to all role endpoints)
export function hasRole(...allowedRoles: string[]) {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role === 'admin' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    res.status(403).json({ message: "Forbidden: Insufficient permissions" });
  };
}
