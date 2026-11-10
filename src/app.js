const express = require("express");
const app = express();
const cors = require("cors");
const {loggerMiddleware} = require("../middlewares/logger")
const errorHandler = require("../middlewares/errorHandling");
const authRoutes = require("../routes/auth.routes");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(loggerMiddleware);

//Routes
app.use("/api/auth", authRoutes);


//Welcome route
app.get("/", (req, res)=>{
    res.status(200).json({
        message: "Welcome to finTech API",
        success: true,
        version: "1.0.0"
    })
})

//Health check route
app.get("/health", (req, res)=>{
    res.status(200).json({
        message: "API is healthy and running",
        success: true,
        environment: process.env.NODE_ENV
    })
})

app.use(errorHandler);

module.exports = app;
