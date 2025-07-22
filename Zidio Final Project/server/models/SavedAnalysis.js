import mongoose from "mongoose"
const SavedAnalysisSchema = new mongoose.Schema(
            {
                userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'UploadedFile' },

                chartTitle: String,

                chartType: String, // e.g., 'bar', 'pie', '3d-scatter'

                selectedFields: [String], // Can be ['Product', 'Revenue'] or ['X', 'Y', 'Z']
                
                chartOptions: Object, // Extra config like color, 3D depth, labels
                filters: Object,      // Any filters user applies (e.g., { region: 'Asia' })

                summary: [String], // Optional AI-generated insights as array of strings

                createdAt: { type: Date, default: Date.now }
            }
)

const SavedAnalysis = mongoose.model('SavedAnalysis',SavedAnalysisSchema);
export default SavedAnalysis;