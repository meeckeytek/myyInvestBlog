import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    isAdmin: {type: String, default: false},
    firstName:{type: String},
    lastName:{type: String},
    phoneNumber:{type: String},
    email:{type: String},
    password:{type: String},
    resetLink:{data: String, default: ''}
},{
    timestamps: true
})
export default mongoose.model('User', userSchema)