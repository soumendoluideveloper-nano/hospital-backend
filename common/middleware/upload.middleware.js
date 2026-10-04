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
    let ext = path.extname(file.originalname || "").toLowerCase();
    if (!ext) {
      if (file.mimetype === "image/png") ext = ".png";
      else if (file.mimetype === "image/webp") ext = ".webp";
      else if (file.mimetype === "application/pdf") ext = ".pdf";
      else if (file.mimetype === "image/gif") ext = ".gif";
      else ext = ".jpg";
    }
    const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, name);
  }
});

/** File filter — images & PDFs with flexible mobile fallback */
const fileFilter = (_req, file, cb) => {
  const allowedExts = /jpeg|jpg|png|gif|webp|pdf/i;
  const allowedMimes = /^image\/(jpeg|jpg|png|gif|webp)|application\/pdf/i;

  const originalName = file.originalname || "";
  const ext = path.extname(originalName).replace(".", "").toLowerCase();
  const mime = file.mimetype || "";

  const isExtValid = ext ? allowedExts.test(ext) : false;
  const isMimeValid = mime ? allowedMimes.test(mime) : false;

  // Accept if extension or mimetype matches, or if octet-stream with valid extension
  if (isExtValid || isMimeValid || (!ext && mime.startsWith("image/"))) {
    return cb(null, true);
  }

  cb(new Error("Only images (jpeg, jpg, png, gif, webp) and PDFs are allowed."));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB for high-res camera photos
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

