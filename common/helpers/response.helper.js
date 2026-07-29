/**
 * Response Helper
 * Standardised API response structure used across all services.
 *
 * Shape:
 *  { status, message, data?, meta? }
 */

/**
 * Send a success response.
 * @param {object} res       - Express response object
 * @param {string} message   - Human-readable message
 * @param {*}      data      - Payload (object | array | null)
 * @param {number} [code=200]- HTTP status code
 * @param {object} [meta]    - Optional pagination / extra info
 */
exports.success = (res, message, data = null, code = 200, meta = null) => {
  const body = { status: 1, message };
  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;
  return res.status(code).json(body);
};

/**
 * Send an error response.
 * @param {object} res       - Express response object
 * @param {string} message   - Human-readable error message
 * @param {number} [code=400]- HTTP status code
 * @param {*}      [errors]  - Detailed validation / system errors
 */
exports.error = (res, message, code = 400, errors = null) => {
  const body = { status: 0, message };
  if (errors !== null) body.errors = errors;
  return res.status(code).json(body);
};

/**
 * Send a paginated list response.
 * @param {object} res
 * @param {string} message
 * @param {Array}  rows
 * @param {number} count  - total matching records
 * @param {number} page   - current page (1-indexed)
 * @param {number} limit  - page size
 */
exports.paginated = (res, message, rows, count, page, limit) => {
  return res.status(200).json({
    status: 1,
    message,
    data: rows,
    meta: {
      total:       count,
      page:        Number(page),
      limit:       Number(limit),
      total_pages: Math.ceil(count / limit)
    }
  });
};
