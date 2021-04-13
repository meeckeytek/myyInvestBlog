import { Router } from "express";
import * as logsController from "../Controllers/logsController";
import { isAdmin, isAuth } from "../middlewares/util";
const logRouter = Router();

//Default route
logRouter.get("/", logsController.defaultRoute);

//All logs
logRouter.get("/allLogs", isAuth, logsController.allLogs);

//User logs
logRouter.get("/userLog/:userId", isAuth, logsController.userLogs);

export default logRouter;
