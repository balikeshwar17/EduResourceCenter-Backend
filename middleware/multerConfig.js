// config/multerConfig.js

const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Destination folder for uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Generate unique file name
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
        cb(null, true); // Accept PDF files
    } else {
        cb(new Error('Invalid file type. Only PDF files are allowed.'), false); // Reject non-PDF files
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

module.exports = upload;
