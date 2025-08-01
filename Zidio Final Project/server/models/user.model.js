import mongoose from "mongoose"


const userSchema = new mongoose.Schema({
    name: {
        type: String, 
        required:true,
        trim:true,
    },
    email: {
        type:String,
        required:true,
        unique: true,
        trim:true
    },
    password:{
        type:String,
        required:true,
    },
    uploadedFiles:[
        {
            type: mongoose.Schema.Types.ObjectId, ref: "UploadedFile" 
        }
    ],
    isAdmin:
        {
            type:Boolean,
            default:false
        },
    savedAnalyses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SavedAnalysis"
        }
    ],
});


const User = mongoose.model("User",userSchema);
export default User;