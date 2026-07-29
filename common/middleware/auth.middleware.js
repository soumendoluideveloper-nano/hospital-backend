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
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return error(res, "Authorization header missing", 401);
      }

      const [scheme, token] = authHeader.split(" ");

      if (scheme !== "Bearer" || !token) {
        return error(res, "Invalid authorization format. Use: Bearer <token>", 401);
      }

      const decoded = verifyToken(token);

      // Attach decoded payload to request
      req.user = decoded; // { id, role, phone, email, ... }

      // Role-based access control
      if (options.roles && options.roles.length > 0) {
        if (!options.roles.includes(decoded.role)) {
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
        return error(res, "Token has expired. Please login again.", 401);
      }
      return error(res, "Invalid or malformed token", 401);
    }
  };
};
