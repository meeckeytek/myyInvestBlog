import mongoose from 'mongoose';

const trashSchema = new mongoose.Schema({
    firstName:{type: String},
    lastName:{type: String},
    phoneNumber:{type: Number},
    email:{type: String},
    image:{type: String},
    title:{type: String},
    body:{type: String},
    count:{type: Number},
    likes:[{type: mongoose.Types.ObjectId, ref:'User'}],
    creator:{type: mongoose.Types.ObjectId, ref:'User'},
    cloudinary_id:{type: String},
    deletedFrom:{type: String},
    comments:[]
},{
    timestamps: true
})
export default mongoose.model('Trash', trashSchema)