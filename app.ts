import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import * as dotenv from "dotenv";
import userRoute from "./routes/userRouter";
import blogRouter from "./routes/blogRouter";
import logRouter from "./routes/logsRouter";
import msg from "./middlewares/Messages";

dotenv.config();

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(cors());

app.use("/api/v1/user", userRoute);

app.use("/api/v1/blog", blogRouter);

app.use("/api/v1/log", logRouter);

app.get("/api/v1", (req: any, res: any) => {
  res.status(200).json({ message: msg.defaultMsg });
});

//Connecting to MongoDb
mongoose
.connect(process.env.CONNECTION!,{useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex : true,  useFindAndModify: false  })
.then(()=>{
const port = process.env.PORT || 8088;
app.listen(port, () => console.log(`listening on port ${port}`));
})
.catch(err=>{
    console.log(err)
});
