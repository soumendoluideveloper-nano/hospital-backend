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

    const { test_name, description, price, report_duration } = req.body;
    if (!test_name) return error(res, "test_name is required");

    const test = await db.LabTest.create({
      clinic_id: clinicId, test_name, description, price, report_duration
    });
    return success(res, "Lab test added", test, 201);
  } catch (err) {
    console.error("[labTest.createTest]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/lab/tests  (public — patients browse tests by clinic)
// Query: clinic_id (required), search, page, limit
// ------------------------------------------------------------------
exports.listTests = async (req, res) => {
  try {
    const { clinic_id, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    if (!clinic_id) return error(res, "clinic_id query parameter is required");

    const { Op } = require("sequelize");
    const where  = { clinic_id, status: "Active" };
    if (search) where.test_name = { [Op.like]: `%${search}%` };

    const { count, rows } = await db.LabTest.findAndCountAll({
      where,
      limit:  Number(limit),
      offset: Number(offset),
      order:  [["test_name","ASC"]]
    });

    return paginated(res, "Lab tests fetched", rows, count, page, limit);
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
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await db.LabTest.findAndCountAll({
      where:  { clinic_id: clinicId },
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

    const allowed = ["test_name","description","price","report_duration","status"];
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
