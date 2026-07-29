/**
 * Review Routes (Patient-facing)
 */
const router     = require("express").Router();
const controller = require("../controllers/review.controller");
const auth       = require("../../../common/middleware/auth.middleware");

router.post("/reviews/doctor", auth({ roles: ["patient"] }), controller.reviewDoctor);
router.post("/reviews/clinic", auth({ roles: ["patient"] }), controller.reviewClinic);
router.get ("/reviews/my",     auth({ roles: ["patient"] }), controller.myReviews);

module.exports = router;
