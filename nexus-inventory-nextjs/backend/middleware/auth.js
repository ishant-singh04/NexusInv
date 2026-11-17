const jwt = require('jsonwebtoken');
const { AuthenticationError, AuthorizationError } = require('../utils/errorResponse');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { ROLES } = require('../config/constants');
const asyncHandler = require('../utils/asyncHandler');

// Protect routes - verify JWT token
exports.protect = asyncHandler(async (req, res, next) => {
    let token;

    // Get token from header or cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
        token = req.cookies.token;
    }

    if (!token) {
        throw new AuthenticationError('Not authorized to access this route');
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const user = await User.findById(decoded.id).select('+password');

        if (!user) {
            throw new AuthenticationError('User not found');
        }

        // Check if user is active
        if (!user.isActive) {
            throw new AuthenticationError('User account is deactivated');
        }

        // Check if password was changed after token was issued
        if (user.changedPasswordAfter(decoded.iat)) {
            throw new AuthenticationError('Password recently changed. Please login again.');
        }

        // Attach user to request
        req.user = user;

        // Log access if in production
        if (process.env.NODE_ENV === 'production') {
            await AuditLog.create({
                action: 'ACCESS',
                entity: 'SYSTEM',
                description: `Accessed ${req.method} ${req.originalUrl}`,
                performedBy: user._id,
                performedByName: user.name,
                userRole: user.role,
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });
        }

        next();
    } catch (error) {
        throw new AuthenticationError('Invalid or expired token');
    }
});

// Role-based authorization
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new AuthenticationError('Not authenticated');
        }

        const allowedRoles = roles.map(role => role.toLowerCase());

        // STRICT ADMIN CHECK: Admin role requires isAdmin flag
        if (allowedRoles.includes('admin')) {
            if (req.user.isAdmin === true) {
                return next(); // User is admin, allow access
            }
        }

        // Check if user's role matches any allowed role
        const userRole = req.user.role.toLowerCase();
        if (allowedRoles.includes(userRole)) {
            return next();
        }

        throw new AuthorizationError(
            `Access denied: ${req.user.role} role is not authorized`
        );
    };
};

// Permission-based access control
exports.checkPermissions = (permissions) => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user) {
            throw new AuthenticationError('Not authenticated');
        }

        // Admin has all permissions
        if (req.user.role === ROLES.ADMIN) {
            return next();
        }

        // Check specific permissions
        // This is a simplified version - in real app, you'd have a proper permission system
        const userPermissions = getPermissionsByRole(req.user.role);

        for (const permission of permissions) {
            if (!userPermissions.includes(permission)) {
                throw new AuthorizationError(
                    `Missing required permission: ${permission}`
                );
            }
        }

        next();
    });
};

// Helper function to get permissions by role
const getPermissionsByRole = (role) => {
    const permissions = {
        [ROLES.ADMIN]: [
            'user:create', 'user:read', 'user:update', 'user:delete',
            'product:create', 'product:read', 'product:update', 'product:delete',
            'inventory:create', 'inventory:read', 'inventory:update', 'inventory:delete',
            'category:create', 'category:read', 'category:update', 'category:delete',
            'report:generate', 'export:create', 'settings:manage'
        ],
        [ROLES.MANAGER]: [
            'user:read',
            'product:create', 'product:read', 'product:update',
            'inventory:create', 'inventory:read', 'inventory:update',
            'category:read',
            'report:generate', 'export:create'
        ],
        [ROLES.STAFF]: [
            'product:read',
            'inventory:read', 'inventory:update',
            'category:read'
        ],
        [ROLES.VIEWER]: [
            'product:read',
            'inventory:read',
            'category:read'
        ]
    };

    return permissions[role] || [];
};

// Rate limiting window helper
const getRateLimitWindowMs = (val) => {
    const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 900,000 ms (15 minutes)
    if (!val) return DEFAULT_WINDOW_MS;

    // Check if it's a pure numeric string (digits only)
    if (typeof val === 'string' && /^\d+$/.test(val.trim())) {
        const parsed = parseInt(val.trim(), 10);
        return parsed >= 1000 ? parsed : DEFAULT_WINDOW_MS;
    }

    if (typeof val === 'number' && !isNaN(val)) {
        return val >= 1000 ? val : DEFAULT_WINDOW_MS;
    }

    // Invalid, NaN, expressions like "15*60*1000", or values < 1000ms
    return DEFAULT_WINDOW_MS;
};

exports.getRateLimitWindowMs = getRateLimitWindowMs;

// Rate limiting middleware
exports.rateLimiter = require('express-rate-limit')({
    windowMs: getRateLimitWindowMs(process.env.RATE_LIMIT_WINDOW_MS),
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});