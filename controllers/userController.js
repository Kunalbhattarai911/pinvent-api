const asyncHandler = require("express-async-handler");
const User = require("../models/userModels");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

//const generateToken = (id) => {
//console.log("hello")
//  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d"});
//};


//Register User
const registerUser = asyncHandler(async (req, res) => {
    // if(!req.body.email) {
    //     res.status(400)
    //     throw new Error("Please add an email");
    // }
    // res.send("Register User");

    try {
        const { name, email, password, phone, bio } = req.body;

        //validation
        if (!name || !email || !password) {
            return res.status(400)
                .json({
                    message: 'Please fill all the fields'
                });

            // res.status(400)
            // throw new Error("Password must be upto 6 characters");
        }

        if (password.length < 6) {
            return res.status(400)
                .json({
                    message: 'password must be upto 6 characters'
                });

            //     res.status(400)
            //     throw new Error("Password must be upto 6 characters");
        }

        //check if user email already exists
        const userExists = await User.findOne({ email })

        if (userExists) {
            return res.status(400)
                .json({
                    message: 'Email has already been registered'
                });


            //     res.status(400)
            //     throw new Error("Email has already been registered");
        }

        //Encrypt password before saving to DB
        //  const salt = await bcrypt.genSalt(10)
        //  const hashedPassword = await bcrypt.hash(password, salt)


        //create new user
        const user = await User.create({
            name,
            email,
            password,
        });

        //------>  generate  Token

        //  const token = generateToken(user._id)
        const token = jwt.sign(
            { user_id: user._id, email },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        user.token = token;

        //send HTTP-only cookie
        res.cookie("token", user.token, {
            path: "/",
            httpOnly: true,
            expires: new Date(Date.now() + 1000 * 86400), //1 day 
            sameSite: "none",
            secure: true
        })



        if (user) {
            const { _id, name, email, photo, phone, bio, token } = user
            return res.status(201).json({
                _id, name, email, photo, phone, bio, token
            })
        } else {
            return res.status(400)
                .json({
                    message: 'Invalid user data'
                });


            // res.status(400)
            // throw new Error("Invalid user data");
        }


    } catch (error) {

    }
});

//Login User
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    //validate request

    if (!email || !password) {
        return res.status(400)
            .json({
                message: 'Please add email and password'
            });
    }
    //check if user exists
    const user = await User.findOne({ email })
    if (!user) {
        return res.status(400)
            .json({
                message: 'User not found, Please sign up'
            });
    }

    // User exists, check if password is correct
    const passwordIsCorrect = await bcrypt.compare(password, user.password)

    //------>  generate  Token

    //  const token = generateToken(user._id)
    const token = jwt.sign(
        { user_id: user._id, email },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d"
        }
    );

    user.token = token;

    //send HTTP-only cookie
    res.cookie("token", user.token, {
        path: "*",
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400), //1 day 
        sameSite: "none",
        secure: true
    })

    if (user && passwordIsCorrect) {
        const { _id, name, email, photo, phone, bio, token } = user
        return res.status(200).json({
            _id, name, email, photo, phone, bio, token
        })
    } else {
        return res.status(400)
            .json({
                message: 'Invalid email or password'
            });

    }
});

//Logout user 
const logout = asyncHandler(async (req, res) => {
    res.cookie("token", "", {
        path: "/",
        httpOnly: true,
        expires: new Date(0), //logout
        sameSite: "none",
        secure: true
    });
    return res.status(200).json({ message: "Successfully Logged Out" });
});

//Get User data
const getUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
    if (user) {
        const { _id, name, email, photo, phone, bio, } = user
        return res.status(200).json({
            _id, name, email, photo, phone, bio,
        })
    } else {
        return res.status(400)
            .json({
                message: 'User Not Found'
            });
    }
})

//Get login status
const loginStatus = asyncHandler(async (req, res) => {
    if (!req.user) {
        return res.status(200).json({ message: false });
    }

    return res.status(200).json({ message: true });
});

//Update user
const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    // const user = req.user;

    if (user) {
        const { name, email, photo, phone, bio } = user;
        user.email = email;
        user.name = req.body.name || name;
        user.phone = req.body.phone || phone;
        user.photo = req.body.photo || photo;
        user.bio = req.body.bio || bio;

//validation
    if (user.bio.length > 250) {
    return res.status(400)
        .json({
            message: 'Bio must be upto 250 characters'
        });

}

        const updateUser = await user.save()
        return res.status(200).json(updateUser)
    } else {
        return res.status(404).json({ message: 'User Not Found' });

    }
});

//change the password
const changePassword = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    const { oldPassword, password } = req.body
    if (!user) {
        return res.status(400).json({ message: 'User not Found, Please signup ' });
    }

    //validation
    if (!oldPassword || !password) {
        return res.status(400).json({ message: 'Please add old and new password' });
    }
    if (password.length < 6) {
        return res.status(400)
            .json({
                message: 'password must be upto 6 characters'
            });
        }

    //check if old password matches password in DB 
    const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password)

    //save new password
    if (user && passwordIsCorrect) {
        user.password = password
        await user.save()
        return res.status(200).send("password change successful")
    } else {
        return res.status(400).json({ message: 'Old Password Is incorrect' })
    }
});

//forget password
const forgetPassword = asyncHandler(async (req, res) => {
    const { email } = req.body
    const user = await User.findOne({ email })

    if (!user) {
        return res.status(404).json({ message: 'User doesnot exists' })
    }

    //delete token if it exists in DB
    let token = await Token.findOne({ userId: user._id })
    if (token) {
        await token.deleteOne()
    }

    //create reset token
    let resetToken = crypto.randomBytes(32).toString("hex") + user._id

    console.log(resetToken)

    //hashed Token befire saving to DB
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // console.log(hashedToken)

    //save token to DB
    await new Token({
        userId: user._id,
        token: hashedToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * (60 * 1000)  //30 minutes
    }).save()

    //construct Reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`
    //console.log(resetUrl)



    //reset email
    const message = `
    <h2>Hello ${user.name}</h2>
    <p>Please use the URL below to reset your password.</p>
    <p>This reset link is valid for 30 minutes.</p>
    
    <a href= ${resetUrl} clicktracking= off>${resetUrl}</a>
    <p>Regards....</p>
    <p>Pinvent Team</p>
    `;

    const subject = "Password Reset Request";
    const send_to = user.email;
    const sent_from = process.env.EMAIL_USER;

    // console.log(message)
    // console.log(subject)
    // console.log(send_to)



    try {
        await sendEmail(subject, message, send_to, sent_from)
        return res.status(200).json({
            success: true, message: 'Reset Email Sent'
        })

        // const link = `${process.env.FRONTEND_URL}/password-reset/${user._id}/${token.token}`;
        // await sendEmail(user.email, "password reset", link);
        //return res.status(200) .json({success: true, message:'Reset Email Sent'})
    } catch (error) {

        return res.status(500).json({ message: 'Email Not Sent, Please Try Again' })

    }


    //    return res.send("forget password")

});


//---> reset Password
const resetPassword = asyncHandler(async (req, res) => {

    const { password } = req.body
    const { resetToken } = req.params

    //hashed Token, then compare to Token in DB
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    //Find token in DB
    const userToken = await Token.findOne({
        token: hashedToken,
        expiresAt: { $gt: Date.now() }

    })

    if (!userToken) {
        return res.status(404).json({ message: 'Invalid or Expired Token' })
    }

    //find user
    const user = await User.findOne({ _id: userToken.userId })
    user.Password = password
    await user.save()
    return res.status(200).json({
        message: 'Password reset Successful, Please Login'
    })
});


module.exports = {
    registerUser,
    loginUser,
    logout,
    getUser,
    loginStatus,
    updateUser,
    changePassword,
    forgetPassword,
    resetPassword
};