import express from "express";
import dotenv from "dotenv"
import authRoutes from "./routes/auth.routes.js"
import mongoose from "mongoose"
import cors from "cors"

dotenv.config();
const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: 'http://localhost:5173', // frontend origin allowed
  credentials: true, // if you use cookies or authentication headers
  allowedHeaders: ['Content-Type', 'Authorization'],

}));
app.use("/api/auth",authRoutes);



mongoose.connect(process.env.MONGO_URI)
        .then(()=>{
            console.log("connected to database");
            app.listen(port,()=> console.log("server running"));
        })
        .catch((err)=>{
            console.error("Error while connecting to database: ",err);
        });

