const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");
const { fileSizeFormatter } = require("../utils/fileUpload");
const { Mongoose, default: mongoose } = require("mongoose");
const cloudinary = require("cloudinary").v2;

//create the product
const createProduct = asyncHandler( async (req,res) => {
    const {name, sku, category, quantity, price, description} = req.body;

    //validation
    if(!name || !category || !quantity ||!price ||!description){
        return res.status(400) .json({message: 'Please fill in all the fields'})
    }

    //handle image upload
    let fileData = {}
    if (req.file) {

        //save image to cloudinary
        let uploadedFile;
        try {
            uploadedFile = await cloudinary.uploader.upload(req.file.path, {folder: "Pinvent-App", resource_type: "image"})
        } catch (error) {
            return res.status(500) .json ({ message : "image couldnot be uploaded"})
        }

        fileData = {
            fileName : req.file.originalname,
            filepath : uploadedFile.secure_url,
            fileType : req.file.mimetype,
            fileSize : fileSizeFormatter(req.file.size, 2)
            
        }
    }    

    //Create Product
    const product = await Product.create({
        user: req.user.id,
        name,
        sku,
        category,
        quantity,
        price,
        description,
        image: fileData
    })

    return res.status(201) .json(product)
});

//Get all Products
const getProducts = asyncHandler (async (req, res) => {
    const products = await Product.find({user: req.user.id}).sort({'_id':-1})
    res.status(200) .json(products)
});

//get single product
// const getProduct = asyncHandler (async (req, res) => {
//     const product = await Product.findById(req.params.id)

//     //if product doesnot exist
//     if (!product) {
//         res.status(404) .json({message : "product not found"})
//     }


//     //Match product to its user
//     if(product.user.toString() !== req.user.id) {
//         res.status(401) .json({message : "user not authorized"})
//     }

//     res.status(200) .json(product)
// })

//-------> get single product <---------- /

 const getProduct = asyncHandler (async (req, res) => {

const valid = mongoose.Types.ObjectId.isValid(req.params.id);
if(valid)
{
    const product = await Product.findById(req.params.id)
    if(product.user.toString() == req.user.id){
        return res.status(200) .json(product)
    }
    return res.status(200) .json({message:"product found"})
}else{
    return res.status(404) .json({message:"product not found"})
}
 })

//Delete Product
const deleteProducts = asyncHandler (async (req, res) => {
    const product = await Product.findById(req.params.id)
    
    //if product doesnot exist
    if (!product) {
        res.status(404) .json({message : "product not found"})
    }


    //Match product to its user
    if(product.user.toString() !== req.user.id) {
        res.status(401) .json({message : "user not authorized"})
    }
    await product.remove()
    res.status(200) .json({message : "product deleted successfully"})
});    


// ----> update products
const updateProducts = asyncHandler( async (req,res) => {
    const {name, category, quantity, price, description} = req.body;

    const {id} = req.params
    const product = await Product.findById (id)

    //if product doesnot exist
    if (!product) {
        res.status(404) .json({message : "product not found"})
    }

    //Match product to its user
    if(product.user.toString() !== req.user.id) {
        res.status(401) .json({message : "user not authorized"})
    }
    //handle image upload
    let fileData = {}
    if (req.file) {

        //save image to cloudinary
        let uploadedFile;
        try {
            uploadedFile = await cloudinary.uploader.upload(req.file.path, {folder: "Pinvent-App", resource_type: "image"})
        } catch (error) {
            return res.status(500) .json ({ message : "image couldnot be uploaded"})
        }

        fileData = {
            fileName : req.file.originalname,
            filepath : uploadedFile.secure_url,
            fileType : req.file.mimetype,
            fileSize : fileSizeFormatter(req.file.size, 2)
            
        }
    }    

    //Update Product

    const updatedProduct = await Product.findByIdAndUpdate(
        {_id: id},
        {
            name,
            category,
            quantity,
            price,
            description,
            image: Object.keys (fileData).length === 0 ? product?.image : fileData,
        },

        {
            new: true,
            runValidators: true
        }
    )
    
    return res.status(200) .json(updatedProduct)
});



module.exports = {
    createProduct,
    getProducts,
    getProduct,
    deleteProducts,
    updateProducts
};
