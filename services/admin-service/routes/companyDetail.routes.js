/**
 * Company Details Routes (Super Admin & Public)
 */
const router     = require("express").Router();
const controller = require("../controllers/companyDetail.controller");
const auth       = require("../../../common/middleware/auth.middleware");
const { setFolder, upload } = require("../../../common/middleware/upload.middleware");

const isAdmin = auth({ roles: ["superadmin"] });

const uploadCompanyAssets = upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "favicon", maxCount: 1 }
]);

// Public / Any user: fetch company details for branding, footer, logo, favicon
router.get("/company-details", controller.getCompanyDetails);

// Super Admin: Update company details and branding
router.post(
  "/company-details",
  isAdmin,
  setFolder("company"),
  uploadCompanyAssets,
  controller.updateCompanyDetails
);

router.put(
  "/company-details",
  isAdmin,
  setFolder("company"),
  uploadCompanyAssets,
  controller.updateCompanyDetails
);

module.exports = router;
