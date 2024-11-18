
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import auth from "./routes/auth.route.js"
import finance from "./routes/finance.routes.js"

dotenv.config();

import cookieParser from 'cookie-parser';

import path from 'path';

mongoose.connect(process.env.MOGO_DATABASE).then(()=>{
        console.log("CONNECTED TO MONGODB");
    }).catch(err=>{
        console.log(err.message);
    });


    const __dirname = path.resolve();



const app = express();

app.use(express.json());

app.use(cookieParser());


app.get('/', (req, res) => {
    res.status(200).json({
        message: "Backend is working correctly!",
        status: "success",
        timestamp: new Date().toISOString(),
    });
});

app.use('/api/auth', auth);

app.use('/api/finance', finance);


app.listen(3000, ()=>{
    console.log("SERVER STARTED ON PORT 3000");
});


app.use(express.static(path.join(__dirname, '/client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
})


app.use((err, req, res, next)=>{
    const statusCode = res.statusCode || 500;
    const message = err.message || "INTERNAL SERVER ERROR";

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
    })
})