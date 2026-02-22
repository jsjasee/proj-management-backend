import multer from "multer";

// declare the storage of where you are going to keep
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // file is a param that will be auto added by multer
    // cb is for callback
    cb(null, `./public/images`); // first args is error, indicated null for this as you prob don't want to handle any errors here? 2nd arg is the destination
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`); // make the name unique by prefixing the date on top of the original name SO THAT user uploading files with the same name will NOT have their files overwritten.
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 1 * 1000 * 1000 }, // this means 1MB?
});
