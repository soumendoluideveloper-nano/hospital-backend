/**
 * Lab Test Routes
 * Base prefix: /api/lab
 */
const router     = require("express").Router();
const controller = require("../controllers/labTest.controller");
const auth       = require("../../../common/middleware/auth.middleware");

// Public
router.get("/tests", controller.listTests);

// Clinic admin
router.post  ("/tests",        auth({ roles: ["clinic"] }), controller.createTest);
router.get   ("/tests/my",     auth({ roles: ["clinic"] }), controller.myTests);
router.put   ("/tests/:id",    auth({ roles: ["clinic"] }), controller.updateTest);
router.delete("/tests/:id",    auth({ roles: ["clinic"] }), controller.deleteTest);

module.exports = router;
