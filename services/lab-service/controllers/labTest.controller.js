/**
 * Lab Test Controller
 * Clinic manages their test catalogue; patients browse and book.
 */

const db     = require("../../../common/models");
const { success, error, paginated } = require("../../../common/helpers/response.helper");

// ------------------------------------------------------------------
// POST /api/lab/tests  (clinic admin)
// ------------------------------------------------------------------
exports.createTest = async (req, res) => {
  try {
    const clinicId = req.user.id;

    // Verify clinic has_lab
    const clinic = await db.Clinic.findByPk(clinicId);
    if (!clinic || !clinic.has_lab) {
      return error(res, "Your clinic does not have lab services enabled", 403);
    }

    const { test_name, category, description, price, report_duration } = req.body;
    if (!test_name) return error(res, "test_name is required");

    const test = await db.LabTest.create({
      clinic_id: clinicId,
      test_name,
      category: category || "General",
      description,
      price,
      report_duration
    });
    return success(res, "Lab test added", test, 201);
  } catch (err) {
    console.error("[labTest.createTest]", err);
    return error(res, "Internal server error", 500);
  }
};

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ------------------------------------------------------------------
// GET /api/lab/tests  (public — patients browse tests by clinic or city/location)
// Query: clinic_id (optional), search, category, latitude, longitude, page, limit
// ------------------------------------------------------------------
exports.listTests = async (req, res) => {
  try {
    const { clinic_id, search, category, latitude, longitude, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { Op } = require("sequelize");
    const where = { status: "Active" };
    if (clinic_id) where.clinic_id = clinic_id;
    if (search && search.trim()) {
      const q = search.trim();
      where[Op.or] = [
        { test_name: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
        { category: { [Op.like]: `%${q}%` } },
      ];
    }
    if (category && category !== "All") where.category = category;

    const clinicInclude = {
      model: db.Clinic,
      as: "clinic",
      attributes: ["id", "name", "logo", "phone", "address", "city", "state", "latitude", "longitude", "has_lab"],
      where: { status: "Active" }
    };

    const { count, rows } = await db.LabTest.findAndCountAll({
      where,
      include: [clinicInclude],
      limit: Number(limit),
      offset: Number(offset),
      order: [["created_at", "DESC"], ["test_name", "ASC"]]
    });

    let testsData = rows.map((r) => r.toJSON());

    // Calculate distance if user lat/long provided
    if (latitude && longitude) {
      const userLat = parseFloat(latitude);
      const userLng = parseFloat(longitude);

      testsData = testsData.map((test) => {
        let dist = null;
        if (test.clinic?.latitude && test.clinic?.longitude) {
          const cLat = parseFloat(test.clinic.latitude);
          const cLng = parseFloat(test.clinic.longitude);
          if (!isNaN(cLat) && !isNaN(cLng)) {
            dist = parseFloat(haversineDistance(userLat, userLng, cLat, cLng).toFixed(1));
          }
        }
        return {
          ...test,
          distance_km: dist,
        };
      });

      testsData.sort((a, b) => {
        if (a.distance_km === null && b.distance_km === null) return 0;
        if (a.distance_km === null) return 1;
        if (b.distance_km === null) return -1;
        return a.distance_km - b.distance_km;
      });
    }

    return paginated(res, "Lab tests fetched", testsData, count, page, limit);
  } catch (err) {
    console.error("[labTest.listTests]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/lab/tests/my  (clinic admin — own tests)
// ------------------------------------------------------------------
exports.myTests = async (req, res) => {
  try {
    const clinicId = req.user.id;

    // Verify clinic has_lab
    const clinic = await db.Clinic.findByPk(clinicId);
    if (!clinic || !clinic.has_lab) {
      return error(res, "Your clinic does not have lab services enabled", 403);
    }

    const { category, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = { clinic_id: clinicId };
    if (category && category !== "All") where.category = category;

    const { count, rows } = await db.LabTest.findAndCountAll({
      where,
      limit:  Number(limit),
      offset: Number(offset),
      order:  [["created_at","DESC"]]
    });

    return paginated(res, "Lab tests fetched", rows, count, page, limit);
  } catch (err) {
    console.error("[labTest.myTests]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// PUT /api/lab/tests/:id  (clinic admin)
// ------------------------------------------------------------------
exports.updateTest = async (req, res) => {
  try {
    const test = await db.LabTest.findOne({ where: { id: req.params.id, clinic_id: req.user.id } });
    if (!test) return error(res, "Lab test not found", 404);

    const allowed = ["test_name","category","description","price","report_duration","status"];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    await test.update(updates);
    return success(res, "Lab test updated", test);
  } catch (err) {
    console.error("[labTest.updateTest]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// DELETE /api/lab/tests/:id  (clinic admin — soft delete)
// ------------------------------------------------------------------
exports.deleteTest = async (req, res) => {
  try {
    const test = await db.LabTest.findOne({ where: { id: req.params.id, clinic_id: req.user.id } });
    if (!test) return error(res, "Lab test not found", 404);
    await test.update({ status: "Inactive" });
    return success(res, "Lab test removed");
  } catch (err) {
    console.error("[labTest.deleteTest]", err);
    return error(res, "Internal server error", 500);
  }
};
