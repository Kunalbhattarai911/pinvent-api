const dotenv = require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyparser = require("body-parser");
const userRoute = require("./routes/userRoute"); 
const productRoute = require("./routes/productRoute"); 
const contactRoute = require("./routes/contactRoute"); 
const errorHandler = require("./middleWare/errorMiddleware");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();

//Middlewares
app.use(express.json());

// app.use(cookies());
app.use(cookieParser());
app.use(express.urlencoded({extended:false}));
app.use(bodyparser.json());
app.use(
       cors({
         origin: ["http://localhost:3000"],
         credentials: true,
       })
     );
app.use(errorHandler);

app.use("/uploads", express.static(path.join(__dirname, "uploads")))

//Routes Middleware
app.use("/api/users", userRoute);
app.use("/api/products", productRoute);
app.use("/api/contactus", contactRoute);


//Routes

app.get("/", (req,res)=>{
       res.send("Home Page");
});

// conect to mongoose DB and start the server

const PORT = process.env.PORT || 5000;


mongoose.set('strictQuery', false);
mongoose
       .connect(process.env.MONGO_URI)
       .then(() => {
        app.listen(PORT, () => {
            console.log(`Server Running on port ${PORT}`)
        })

       })

       // .catch((err) => console.log(err))