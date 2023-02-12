const asyncHandler = require("express-async-handler");
const User = require("../models/userModels");
const jwt = require("jsonwebtoken");

const protect= asyncHandler ( async (req, res, next) => {
    try {
        const token = req.headers.authorization;
        const accessToken = token.split(" ")[1];
        if (!accessToken) {
            return res.status(401)
            .json({
                message: 'Not authorized, Please Login in'
            })
        }
        
            //verify the token
            const verified = jwt.verify(accessToken, process.env.JWT_SECRET);

           // console.log(verified);

            //get user id from token
            const user = await User.findById(verified.user_id).select("-password")
            
            if(!user){
               return res.status(401)
            .json({
                message: 'User not found'
            });
            }
            req.user = user;
            next ()
        
        
    } catch (error) {
        return res.status(401)
            .json({
                message: 'Not authorized, Please Login in'
            });
    } 
})

module.exports = protect;
