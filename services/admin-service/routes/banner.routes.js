/**
 * Banner Routes (Super Admin)
 */
const router     = require("express").Router();
const controller = require("../controllers/banner.controller");
const auth       = require("../../../common/middleware/auth.middleware");
const { setFolder, upload } = require("../../../common/middleware/upload.middleware");

const isAdmin = auth({ roles: ["superadmin"] });

// Public — patients see active banners
router.get("/banners/active", controller.listBanners);

// Admin
router.get   ("/banners",       isAdmin, controller.listBanners);
router.post  ("/banners",       isAdmin, setFolder("banners"), upload.single("image"), controller.createBanner);
router.put   ("/banners/:id",   isAdmin, setFolder("banners"), upload.single("image"), controller.updateBanner);
router.delete("/banners/:id",   isAdmin, controller.deleteBanner);

module.exports = router;
