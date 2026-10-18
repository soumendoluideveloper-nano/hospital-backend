/**
 * Auth Middleware
 * Validates Bearer JWT and attaches decoded user to req.user.
 * Supports optional role-based access control via `roles` option.
 *
 * Usage:
 *   router.get('/profile',          auth(),                              ctrl.get);
 *   router.post('/complete-profile', auth({ roles: ['pending_patient'] }), ctrl.post);
 *   router.delete('/clinic/:id',    auth({ roles: ['superadmin'] }),     ctrl.delete);
 *
 * Roles: 'patient' | 'clinic' | 'superadmin' | 'pending_patient' | 'pending_clinic'
 */

const { verifyToken } = require("../helpers/jwt.helper");
const { error }       = require("../helpers/response.helper");

/**
 * @param {object}   [options]
 * @param {string[]} [options.roles] - Allowed roles. Omit to allow any authenticated user.
 */
module.exports = (options = {}) => {
  return (req, res, next) => {
    try {
      console.log("[auth.middleware] Validating token for route:", req.method, req.originalUrl);
      console.log("[auth.middleware] Allowed roles:", options.roles || "any");
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        console.error("[auth.middleware] Authorization header missing");
        return error(res, "Authorization header missing", 401);
      }

      const [scheme, token] = authHeader.split(" ");

      if (scheme !== "Bearer" || !token) {
        console.error("[auth.middleware] Invalid authorization format:", authHeader);
        return error(res, "Invalid authorization format. Use: Bearer <token>", 401);
      }

      const decoded = verifyToken(token);

      // Attach decoded payload to request
      req.user = decoded; // { id, role, phone, email, ... }

      // Role-based access control
      if (options.roles && options.roles.length > 0) {
        if (!options.roles.includes(decoded.role)) {
          console.error("[auth.middleware] Access denied for user:", decoded.id, "with role:", decoded.role);
          return error(
            res,
            `Access denied. Required role(s): ${options.roles.join(", ")}`,
            403
          );
        }
      }

      next();
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        console.error("[auth.middleware]", err);
        return error(res, "Token has expired. Please login again.", 401);
      }
      console.error("[auth.middleware]", err);
      return error(res, "Invalid or malformed token", 401);
    }
  };
};
