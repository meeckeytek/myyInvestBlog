import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    firstName:{type: String},
    lastName:{type: String},
    phoneNumber:{type: Number},
    email:{type: String},
    password:{type: String},
    resetLink:{data: String, default: ''}
},{
    timestamps: true
})
export default mongoose.model('User', userSchema)