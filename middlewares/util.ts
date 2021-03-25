import { Response, Request } from "express";
import * as jwt from "jsonwebtoken";
const HttpError = require("./http-error");

export const getToken = (existed: any) => {
  return jwt.sign(
    {
      userId: existed._id,
      userEmail: existed.email,
      isAdmin: existed.isAdmin,
      firstname: existed.firstname,
      lastname: existed.lastname,
      email: existed.email,
    },
    `${process.env.JWT_KEY}`,
    { expiresIn: "14d" }
  );
};

export const resetPasswordToken = (user: any) => {
  return jwt.sign(
    { userId: user.id, userEmail: user.email },
    `${process.env.JWT_KEY}`,
    { expiresIn: "1s" }
  );
};

export const isAuth = (req: Request | any, res: Response | any, next: any) => {
  if (req.method === "OPTION") {
    return next();
  }
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (token) {
      jwt.verify(
        token,
        `${process.env.JWT_KEY}`,
        function (err: any, decoded: any) {
          if (err) {
            res.status(401).send({ message: "Invalid Token" });
          } else {
            req.user = decoded;
            next();
          }
        }
      );
    } else {
      throw new Error("You are not authorized to perform this function");
    }
  } catch (err) {
    const error = new HttpError(
      "You are not authorized to perform this function",
      403
    );
    return next(error);
  }
};

export const isAdmin = (req: Request | any, res: Response | any, next: any) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res
      .status(403)
      .json({
        message: "Only Admins are authorized to perform this operation",
      });
  }
};
