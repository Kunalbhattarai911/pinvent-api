const express = require("express");
const {createProduct, getProducts, getProduct, deleteProducts, updateProducts} = require("../controllers/productController");
const protect = require("../middleWare/authMiddleware");
const { upload } = require("../utils/fileUpload");
const router = express.Router();

router.post("/", protect, upload.single("image"), createProduct)  //for multiple file we change upload.single into upload.array
router.get("/", protect, getProducts);
router.get("/:id", protect, getProduct);
router.delete("/:id", protect, deleteProducts);
router.patch("/:id", protect, upload.single("image"), updateProducts)  


module.exports = router;