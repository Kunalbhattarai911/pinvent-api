const asyncHandler = require("express-async-handler");
const User = require("../models/userModels");
const sendEmail = require("../utils/sendEmail");

const contactUs = asyncHandler(async (req, res) => {
  const { subject, message } = req.body;
  const user = await User.findById(req.user._id);

  console.log(user)

  if (!user) {
    res.status(400)
    .json({message : "User not found, please signup"});
  }

  //   Validation
  if (!subject || !message) {
    res.status(400)
    .json({message:"Please add subject and message"});
  }

  const send_to = User.email;
  const sent_from = process.env.EMAIL_USER;
  const reply_to = User.email;
  try {
    await sendEmail(subject, message, send_to, sent_from, reply_to);
   return res.status(200).json({ success: true, message: "Email Sent" });
  } catch (error) {
    return res.status(500)
    .json({message:"Email not sent, please try again"});
  }
});

module.exports = {
  contactUs,
};
