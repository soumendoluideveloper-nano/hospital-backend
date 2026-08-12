/**
 * Upload Middleware
 * Wraps multer with disk-storage for profile images, logos, and lab reports.
 *
 * Usage:
 *   router.post('/profile', upload.single('profile_image'), controller.update);
 *   router.post('/report',  upload.single('report_file'),   controller.upload);
 */

const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

/** Ensure upload directory exists */
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

/** Absolute path to the shared uploads root (hospital-backend/public/uploads) */
const UPLOADS_ROOT = path.resolve(__dirname, "../../public/uploads");

/** Multer disk storage — organized by sub-folder */
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const folder = req.uploadFolder || "misc";
    const dir = path.join(UPLOADS_ROOT, folder);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, name);
  }
});

/** File filter — images only (loosened for PDFs on reports) */
const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|pdf/;
  const ext     = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime    = allowed.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  cb(new Error("Only images (jpeg, jpg, png, gif, webp) and PDFs are allowed."));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

/**
 * Middleware factory to set the upload sub-folder before multer runs.
 * @param {string} folder  e.g. 'profiles', 'logos', 'reports'
 */
exports.setFolder = (folder) => (req, _res, next) => {
  req.uploadFolder = folder;
  next();
};

exports.upload = upload;
