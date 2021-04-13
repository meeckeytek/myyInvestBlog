import { Request, Response } from "express";
import User from "../models/user.model";
import Log from "../models/logs.model";
import msg from "../middlewares/Messages";

// Default Route
export const defaultRoute = async (req: Request | any, res: Response) => {
  res.status(200).json({ message: msg.defaultMsg });
};
// Get all users
export const allLogs = async (req: Request | any, res: Response) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const sortBy = req.query.sortBy || "createdAt";
  const orderBy = req.query.orderBy || "-1";
  const sortQuery = {
    [sortBy]: orderBy,
  };

  const retrievedCounts = await Log.countDocuments();
  Log.find()
    .sort(sortQuery)
    .limit(limit)
    .skip(page * limit - limit)
    .then((log) => {
      return res.json({
        log,
        pagination: {
          hasPrevious: page > 1,
          prevPage: page - 1,
          hasNext: page < Math.ceil(retrievedCounts / limit),
          next: page + 1,
          currentPage: Number(page),
          total: retrievedCounts,
          limit: limit,
          lastPage: Math.ceil(retrievedCounts / limit),
        },
        links: {
          prevLink: `http://${req.headers.host}/api/v1/log/allLogs?page=${
            page - 1
          }&limit=${limit}`,
          nextLink: `http://${req.headers.host}/api/v1/log/allLogs?page=${
            page + 1
          }&limit=${limit}`,
        },
      });
    })
    .catch((err) => console.log(err));

  const log = new Log({
    user: req.user.userId,
    description: "Admin view all logs",
  });

  try {
    await log.save();
  } catch (error) {
    return res.status(500).json({ message: msg.serverError });
  }
};

//Get single User Details
export const userLogs = async (req: Request | any, res: Response) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const sortBy = req.query.sortBy || "createdAt";
  const orderBy = req.query.orderBy || "-1";
  const sortQuery = {
    [sortBy]: orderBy,
  };
  let userLogs: any;
  const retrievedCounts = await Log.countDocuments();
  Log.find({ user: req.params.userId })
    .sort(sortQuery)
    .limit(limit)
    .skip(page * limit - limit)
    .then((userLogs) => {
      return res.json({
        userLogs,
        pagination: {
          hasPrevious: page > 1,
          prevPage: page - 1,
          hasNext: page < Math.ceil(retrievedCounts / limit),
          next: page + 1,
          currentPage: Number(page),
          total: retrievedCounts,
          limit: limit,
          lastPage: Math.ceil(retrievedCounts / limit),
        },
        links: {
          prevLink: `http://${req.headers.host}/api/v1/log/allLogs?page=${
            page - 1
          }&limit=${limit}`,
          nextLink: `http://${req.headers.host}/api/v1/log/allLogs?page=${
            page + 1
          }&limit=${limit}`,
        },
      });
    })
    .catch((err) => console.log(err));

  const log = new Log({
    user: req.user.userId,
    description: "Viewed user logs",
  });

  try {
    await log.save();
  } catch (error) {
    return res.status(500).json({ message: msg.serverError });
  }
};
