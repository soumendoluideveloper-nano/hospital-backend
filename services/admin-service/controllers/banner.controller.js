/**
 * Banner Controller (Super Admin)
 * Full CRUD for promotional banners shown in the patient app.
 */

const db     = require("../../../common/models");
const { success, error } = require("../../../common/helpers/response.helper");

// ------------------------------------------------------------------
// POST /api/admin/banners
// ------------------------------------------------------------------
exports.createBanner = async (req, res) => {
  try {
    const { title, redirect_url } = req.body;
    const image = req.file ? "uploads/" + req.file.path.replace(/\\/g, "/").split("uploads/")[1] : null;

    const banner = await db.Banner.create({ title, image, redirect_url });
    return success(res, "Banner created", banner, 201);
  } catch (err) {
    console.error("[banner.createBanner]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/admin/banners  (admin view — all)
// GET /api/admin/banners/active  (public — active only)
// ------------------------------------------------------------------
exports.listBanners = async (req, res) => {
  try {
    const where = {};
    if (req.path.includes("active")) where.status = "Active";

    const banners = await db.Banner.findAll({ where, order: [["created_at","DESC"]] });
    return success(res, "Banners fetched", banners);
  } catch (err) {
    console.error("[banner.listBanners]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// PUT /api/admin/banners/:id
// ------------------------------------------------------------------
exports.updateBanner = async (req, res) => {
  try {
    const banner = await db.Banner.findByPk(req.params.id);
    if (!banner) return error(res, "Banner not found", 404);

    const updates = {};
    if (req.body.title)        updates.title        = req.body.title;
    if (req.body.redirect_url) updates.redirect_url = req.body.redirect_url;
    if (req.body.status)       updates.status       = req.body.status;
    if (req.file)              updates.image        = "uploads/" + req.file.path.replace(/\\/g, "/").split("uploads/")[1];

    await banner.update(updates);
    return success(res, "Banner updated", banner);
  } catch (err) {
    console.error("[banner.updateBanner]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// DELETE /api/admin/banners/:id
// ------------------------------------------------------------------
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await db.Banner.findByPk(req.params.id);
    if (!banner) return error(res, "Banner not found", 404);
    await banner.destroy();
    return success(res, "Banner deleted");
  } catch (err) {
    console.error("[banner.deleteBanner]", err);
    return error(res, "Internal server error", 500);
  }
};
