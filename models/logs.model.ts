import mongoose from 'mongoose';

const logsSchema = new mongoose.Schema({
    user:{type: mongoose.Types.ObjectId, ref: 'User'},
    description:{type: String},
    timestamp: {type: String, default: Date()}
})
export default mongoose.model('Log', logsSchema)