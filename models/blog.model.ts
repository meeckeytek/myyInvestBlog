import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    image:{type: String},
    title:{type: String},
    body:{type: String},
    count:[{type: mongoose.Types.ObjectId, ref:'User'}],
    likes:[{type: mongoose.Types.ObjectId, ref:'User'}],
    creator:{type: String},
    cloudinary_id:{type: String},
    comments:[]
},{
    timestamps: true
})
postSchema.index({title: 'text', body:'text'})
export default mongoose.model('Blog', postSchema)