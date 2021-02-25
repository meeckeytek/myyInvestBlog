import mongoose from 'mongoose';

const trashSchema = new mongoose.Schema({
    firstName:{type: String, required: true},
    lastName:{type: String, required: true},
    phoneNumber:{type: Number, required: true},
    email:{type: String, required: true},
    deletedFrom:{type: String, required: true}
},{
    timestamps: true
})
export default mongoose.model('Trash', trashSchema)