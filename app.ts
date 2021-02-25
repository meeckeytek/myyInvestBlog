import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import * as dotenv from 'dotenv'
import userRouter from './routes/userRoute'

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());

app.use('/api/v1/user', userRouter)
 
//Connecting to MongoDb
mongoose
.connect(process.env.CONNECTION!,{useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex : true,  useFindAndModify: false  })
.then(()=>{
const port = process.env.PORT || 419;
app.listen(port, () => console.log(`listening on port ${port}`))
})
.catch(err=>{
    console.log(err)
});