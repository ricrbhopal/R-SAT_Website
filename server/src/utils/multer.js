 import multer from "multer";

const storage = multer.memoryStorage();

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

const fileFilterImageOnly = (req, file, cb) => {
  if (IMAGE_MIME.includes(file.mimetype)) return cb(null, true);
  const err = new Error("Only image files are allowed (jpeg/png/gif/webp/svg)");
  err.code = "INVALID_IMAGE_TYPE";
  cb(err, false);
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: fileFilterImageOnly,
});

export const uploadSingleImage = (fieldName = "image") => upload.single(fieldName);
export default upload;
