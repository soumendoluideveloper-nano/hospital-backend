/**
 * Dashboard Routes (Super Admin)
 * Base prefix: /api/admin
 */
const router     = require("express").Router();
const controller = require("../controllers/dashboard.controller");
const clinicOverviewController = require("../controllers/clinicOverview.controller");
const auth       = require("../../../common/middleware/auth.middleware");

const isAdmin = auth({ roles: ["superadmin"] });

router.get  ("/dashboard",               isAdmin, controller.getDashboard);
router.get  ("/clinics",                 isAdmin, controller.listClinics);
router.get  ("/clinics/:id/overview",    isAdmin, clinicOverviewController.getClinicOverview);
router.patch("/clinics/:id/enquiries/:enquiryId/status", isAdmin, clinicOverviewController.updateEnquiryStatus);
router.post ("/clinics",                 isAdmin, controller.createClinic);
router.put  ("/clinics/:id",             isAdmin, controller.updateClinic);
router.delete("/clinics/:id",            isAdmin, controller.deleteClinic);
router.patch("/clinics/:id/status",      isAdmin, controller.updateClinicStatus);
router.get  ("/patients",                isAdmin, controller.listPatients);
router.patch("/patients/:id/status",     isAdmin, controller.updatePatientStatus);

module.exports = router;
