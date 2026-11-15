/**
 * Company Details Controller (Super Admin)
 * Manage master company information (address, contact, social links, map, logo, favicon).
 */

const db = require("../../../common/models");
const { success, error } = require("../../../common/helpers/response.helper");

let sharp;
try {
  sharp = require("sharp");
} catch (e) {
  // sharp optional fallback
}

const trimImageIfPossible = async (filePath) => {
  if (!sharp || !filePath) return;
  try {
    const path = require("path");
    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(__dirname, "../../../public", filePath);
    const buf = await sharp(fullPath).trim().toBuffer();
    await sharp(buf).toFile(fullPath);
  } catch (err) {
    console.warn("[companyDetail] Auto-trimming skipped:", err?.message);
  }
};

// Helper to sanitize file path
const formatFilePath = (file, folder = "company") => {
  if (!file) return null;
  // If file has filename, store as uploads/<folder>/<filename>
  if (file.filename) {
    return `uploads/${folder}/${file.filename}`;
  }
  return file.path.replace(/\\/g, "/").replace(/^.*?(public\/|uploads\/)/, "$1");
};

// ------------------------------------------------------------------
// GET /api/admin/company-details
// Public / Admin: fetch company profile & branding
// ------------------------------------------------------------------
exports.getCompanyDetails = async (_req, res) => {
  try {
    let company = await db.CompanyDetail.findOne({ order: [["id", "ASC"]] });

    if (!company) {
      // Seed default record if none exists
      company = await db.CompanyDetail.create({
        company_name: "Health Spot Clinic",
        tagline: "Your Trusted Healthcare Partner",
        email: "contact@healthspot.com",
        phone: "+91 9876543210",
        city: "Kolkata",
        state: "West Bengal",
        country: "India",
        pincode: "700001",
        website_url: "https://healthspot.com",
        about_us: "Leading healthcare and multi-speciality clinic management system.",
        privacy_policy: "<p>Welcome to Health Spot Clinic. We are committed to protecting your personal healthcare data and privacy.</p>",
        terms_and_conditions: "<p>By accessing or using Health Spot Clinic platform and services, you agree to these Terms and Conditions.</p>",
        footer_text: "© 2026 Health Spot. All rights reserved.",
        status: "Active"
      });
    }

    return success(res, "Company details fetched successfully", company);
  } catch (err) {
    console.error("[companyDetail.getCompanyDetails]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// POST/PUT /api/admin/company-details
// Super Admin: create or update company details with logo & favicon
// ------------------------------------------------------------------
exports.updateCompanyDetails = async (req, res) => {
  try {
    let company = await db.CompanyDetail.findOne({ order: [["id", "ASC"]] });

    const allowedFields = [
      "company_name",
      "tagline",
      "email",
      "phone",
      "alternate_phone",
      "address",
      "city",
      "state",
      "country",
      "pincode",
      "website_url",
      "map_link",
      "facebook_url",
      "twitter_url",
      "instagram_url",
      "linkedin_url",
      "youtube_url",
      "whatsapp_no",
      "footer_text",
      "about_us",
      "privacy_policy",
      "terms_and_conditions",
      "status"
    ];

    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Handle uploaded files (logo, favicon)
    if (req.files) {
      if (req.files.logo && req.files.logo.length > 0) {
        updates.logo = formatFilePath(req.files.logo[0], "company");
        await trimImageIfPossible(updates.logo);
      }
      if (req.files.favicon && req.files.favicon.length > 0) {
        updates.favicon = formatFilePath(req.files.favicon[0], "company");
        await trimImageIfPossible(updates.favicon);
      }
    }

    if (!company) {
      company = await db.CompanyDetail.create(updates);
    } else {
      await company.update(updates);
    }

    return success(res, "Company details updated successfully", company);
  } catch (err) {
    console.error("[companyDetail.updateCompanyDetails]", err);
    return error(res, "Internal server error", 500);
  }
};
