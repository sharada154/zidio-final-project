import express from "express"
import dotenv from "dotenv"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import User from "../models/user.model.js"
import { verifyToken } from "../middleware/auth.middleware.js"
import multer from "multer"
import UploadedFile from "../models/UploadedFile.js"
import SavedAnalysis from "../models/SavedAnalysis.js"


const router = express.Router();
dotenv.config();
const key=process.env.SECRET_KEY;

const storage = multer.memoryStorage();
const upload = multer({ storage });




//signup
router.post('/register',async (req,res)=>{
    try{
    const {name,email,password} = req.body;
    //create check if user with email already exists or not
    const hashed = await bcrypt.hash(password, 10); //hashing the password

    const user = new User({ name,email, password: hashed }); //creating new object to store in db

    const result = await user.save();

    if (result) {
      return res.status(201).json({ message: 'User registered' });
    }
    else {
      return res.status(403).json({ message: 'unable to register user'})
    }
    } catch (err) {

      res.status(500).json({ error: err.message });
  }
});

//signin
  router.post('/login', async (req,res)=>{
    try{
      const {email,password}=req.body;
      const user = await User.findOne({email});

      if( !user  ) {
         res.status( 401 ).json( { message : "user doesnt exist" } );
         //refresh the page
      }

      //comparing the password
      const isMatch= await bcrypt.compare(password,user.password);

      if( !isMatch ) {
         res.status(401).json( { message: 'Invalid password' } );
         //refresh the page
         return;

        } else {

          //jwt is created after verifying the user credentials are correct
          jwt.sign(user.toJSON(),key,{expiresIn:'1h'},(err,token)=>{

            if(err) console.log(err);

            res.status(201).json({
              token,
              name: `${user.name}`,
              isAdmin: user.isAdmin,
              message: "successfully logged in"
            });
            return;
          })
      }
    } catch (err) {

      res.status(500).json({ error: err.message });
    }
  });

  router.post('/verify',verifyToken,(req,res)=>{ 
    res.json({message:"user is verified"})
  });

  //route to upload the file
  router.post("/upload",verifyToken,upload.single('file'),async(req,res)=>{
    try{
      if(!req.file) return res.status(400).json({ message: 'No file Uploaded' });

      const userEmail = req.user.email;
      const user = await User.findOne({ email: userEmail });

      if(!user) return res.status(404).json({ message: "user doesnt exist" });


      const fileDoc = await UploadedFile.create({
        filename: req.file.originalname,
        data: req.file.buffer,
        contentType: req.file.mimetype,
        uploadedBy: user._id,
        size: req.file.size
      })

      user.uploadedFiles.push(fileDoc._id);
      await user.save();

      res.status(200).json({ message: 'File uploaded successfully', fileId: fileDoc._id });
    } catch(err) {
      console.error('upload error: ',err);
      res.status(500).json({ message: "server error" })
    }
  })

  //get method to get user 
  router.get("/getUser",verifyToken,async (req,res)=>{
    try{
      const user = await User.findOne({ email: req.user.email });
      return res.status(200).json({ user: user })
    }catch(err){
      console.error(err)
      return res.status(500).json({message: "server error" })
    }
  })

  //path to get all files of a user and return user with all the info
  router.get("/getFiles",verifyToken,async (req,res)=>{
    try{
      const user = await User.findOne({ email: req.user.email })
                                      .populate('uploadedFiles')

      if(!user){
        return res.status(404).json({ message: 'user not found' })
      }
      return res.status(200).json({ user })
    }
    catch(err){
      console.error(err);
      return res.status(500).json({ message: 'server error' })
    }
  })

  //route for downloading
  router.get('/download/:id',verifyToken,async (req,res)=>{
    try{
      const file = await UploadedFile.findById(req.params.id);
      if(!file) return res.status(404).send('file not found');

      res.set({
        'Content-Type': file.contentType,
        'Content-Disposition': `attachment; filename="${file.filename}"`,
      });

      res.send(file.data);
    }catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
  })


  //route for deleting the file
  router.delete('/delete/:id',verifyToken,async (req,res)=>{
    try{
      const file = await UploadedFile.findById(req.params.id);
      if(!file) return res.status(404).send('file not found')

      await UploadedFile.deleteOne({_id: file._id});

       // Remove reference from user
      await User.findOneAndUpdate(
        { email: req.user.email },
        { $pull: { uploadedFiles: file._id } }
      );
      res.status(200).json({ message: 'File deleted successfully' });

    }catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ message: 'Server error' });
  }
  })
  
  //route to get one file
  router.get('/preview/:id', verifyToken, async (req, res) => {
  try {
    const file = await UploadedFile.findById(req.params.id);
    if (!file) return res.status(404).send('File not found');

    res.set({
      'Content-Type': file.contentType,
    });

    res.send(file.data); // buffer or binary data
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

 //route for returning all users
router.get('/getAllUsers', verifyToken, async (req, res) => {
    try {
        // Populate uploadedFiles and savedAnalyses for each user
        const users = await User.find({}, '-password')
            .populate('uploadedFiles')
            .populate('savedAnalyses');
        // For each user, add counts for files and analyses
        const usersWithCounts = users.map(user => ({
            _id: user._id,
            name: user.name,
            isAdmin: user.isAdmin,
            filesUploaded: user.uploadedFiles ? user.uploadedFiles.length : 0,
            analysesMade: user.savedAnalyses ? user.savedAnalyses.length : 0,
        }));
        res.status(200).json({ users: usersWithCounts });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Server error' });
    }
});


//route to save analysis
router.post('/saveAnalysis', verifyToken, async (req, res) => {
  try {
    const { chartTitle, chartType, selectedFields, chartOptions, fileId, summary } = req.body;
    const userId = req.user._id;

    if (!chartType || !selectedFields || !fileId) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const newAnalysis = new SavedAnalysis({
      userId,
      fileId,
      chartTitle,
      chartType,
      selectedFields,
      chartOptions,
      summary // <-- Save summary if provided
    });

    await newAnalysis.save();
        // 2. Update user: push analysis ID to savedAnalysis
    await User.findByIdAndUpdate(userId, {
      $push: { savedAnalyses: newAnalysis._id }
    });

    // 3. Update uploaded file: push analysis ID to analysis
    await UploadedFile.findByIdAndUpdate(fileId, {
      $push: { analyses: newAnalysis._id }
    });

    res.status(201).json({ message: 'Analysis saved successfully', analysis: newAnalysis });
  } catch (err) {
    console.error('Save Analysis Error:', err);
    res.status(500).json({ message: 'Server error saving analysis' });
  }
});

router.get("/getAnalysis", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const analysis = await SavedAnalysis.find({ userId }).select("-__v");
    res.status(200).json({ analysis });

  } catch (err) {
    console.error("fetch analysis history error:", err);
    res.status(500).json({ message: "Failed to fetch saved analyses" });
  }
});

router.get("/getData", verifyToken, async (req, res) => {
  try {
    // Step 1: Fetch all user files
  const user = await User.findOne({ email: req.user.email })
  .populate({
    path: "uploadedFiles",
    select: "_id filename date" // only get _id and filename, no full data
  })
  .populate({
    path: 'savedAnalyses',
    select: "_id chartTitle createdAt"
  })
  
   //console.log(user)
   const files = user.uploadedFiles;

    // Step 2: Fetch all analyses of that user
    const analyses = user.savedAnalyses;
    //console.log(analyses)

   
    res.status(200).json({
      files: files,
      analyses: analyses,
  });
  } catch (err) {
    console.error("Dashboard summary error:", err);
    res.status(500).json({ message: "Failed to fetch dashboard summary" });
  }
});

//route to get one chart
router.get('/analysis/:id', verifyToken, async (req, res) => {
  try {
    const chart = await SavedAnalysis.findById(req.params.id).select("-__v");
    if (!chart) return res.status(404).json({ message: 'Chart not found' });

    res.status(200).json(chart);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving chart' });
  }
});

 //route to delete a analysis and its references
 router.delete('/analysis/:id', verifyToken, async (req, res) => {
  const analysisId = req.params.id;

  try {
    // 1. Find the analysis
    const analysis = await SavedAnalysis.findById(analysisId);
    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }
    const userId = analysis.userId;
    const fileId = analysis.fileId;

    // 2. Delete the analysis
    await SavedAnalysis.findByIdAndDelete(analysisId);

    // 3. Remove references from User and File
    await User.findByIdAndUpdate(userId, {
      $pull: { savedAnalyses: analysisId }
    });

    await UploadedFile.findByIdAndUpdate(fileId, {
      $pull: { analyses: analysisId }
    });

    res.json({ message: 'Analysis deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

//route to change password
router.put('/changePassword', verifyToken, async (req, res)=>{
  const{oldPassword, newPassword} = req.body;
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Old password is incorrect' });

    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
})
export default router;