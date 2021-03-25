import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import * as mailgunLoader from "mailgun-js";
import * as jwt from "jsonwebtoken";
import User from "../models/user.model";
import Trash from "../models/trash.model";
import { validationResult } from "express-validator";

//Output Messages
const notFound: any = {
  status: "Faild",
  code: 404,
  Message: "End point returned not found",
};

const serverError: any = {
  status: "Faild",
  code: 500,
  Message: "Something went wrong, Please try again later",
};

const success: any = {
  status: "Success",
  code: 200,
  Message: "End point returned successfully",
};

const inputError: any = {
  status: "Faild",
  code: 422,
  Message: "Please check all inputs for validity",
};

const alreadyExist: any = {
  status: "Faild",
  code: 409,
  Message: "Already exist",
};

const newUserSuccess: any = {
  status: "Success",
  code: 201,
  Message: "End point returned successfully",
};

const notSuccessful: any = {
  status: "Error",
  code: 400,
  Message: "End point returned not successful",
};

const defaultMsg: any = {
  status: "Success",
  code: 200,
  Message: "Myyinvest tech intern (Auth API)",
};

// Default Route
export const defaultRoute = async (req: Request | any, res: Response) => {
  res.status(200).json({ message: defaultMsg });
};
// Get all users
export const getUser = async (req: Request | any, res: Response) => {
  const page: number = parseInt(req.query.page) || 1;
  const limit: number = parseInt(req.query.limit) || 10;
  const sortBy = req.query.sortBy || "createdBy";
  const orderBy = req.query.orderBy || '-1'
  const sortQuery: any = {
    [sortBy]: orderBy,
  };

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const results: any = {};

  if (endIndex < (await User.countDocuments().exec())) {
    results.nextPageLink = {
      nextPage: `${req.headers.host}/api/v1/user/allUsers?sortBy=${sortBy}&page=${
        page + 1
      }&limit=${limit}`,
    };
  }

  if (startIndex > 0) {
    results.previousPageLink = {
      previousPage: `${req.headers.host}/api/v1/user/allUsers?sortBy=${sortBy}&page=${
        page - 1
      }&limit=${limit}`,
    };
  }

  try {
    results.results = await User.find().sort(sortQuery).limit(limit).skip(startIndex).exec();
  } catch (error) {
    return res.status(500).send({ message: serverError });
  }
  if (!results || results.length < 0) {
    return res.status(404).send({ message: notFound });
  }
  res.status(200).json({ message: success, results });
};

// Get all users
export const softDelUsers = async (req: Request | any, res: Response) => {
  const page: number = parseInt(req.query.page);
  const limit: number = parseInt(req.query.limit);
  const sortBy = req.query.sortBy || "createdAt";
  const orderBy = req.query.orderBy || "-1";
  const sortQuery: any = {
    [sortBy]: orderBy,
  };

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const results: any = {};

  if (endIndex < (await Trash.countDocuments().exec())) {
    results.nextPageLink = {
      nextPage: `${req.headers.host}/api/v1/user/softDelete?sortBy=${sortBy}&page=${
        page + 1
      }&limit=${limit}`,
    };
  }

  if (startIndex > 0) {
    results.previousPageLink = {
      previousPage: `${req.headers.host}/api/v1/user/softDelete?page=${
        page - 1
      }&limit=${limit}`,
    };
  }

  try {
    results.results = await Trash.find({ deletedFrom: "User-Model" })
      .select([
        "-image",
        "-title",
        "-body",
        "-count",
        "-likes",
        "-creator",
        "-cloudinary_id",
        "-comments",
      ])
      .sort(sortQuery)
      .limit(limit)
      .skip(startIndex)
      .exec();
  } catch (error) {
    return res.status(500).send({ message: serverError });
  }
  if (!results || results.length < 0) {
    return res.status(404).send({ message: notFound });
  }
  res.status(200).json({ message: success, results });
  // }
};

//Register new user
export const newUser = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: inputError });
  }
  const { firstName, lastName, email, password, phoneNumber, isAdmin } = req.body;

  let existed: any;

  try {
    existed = await User.findOne({ email });
  } catch (error) {
    return res.status(500).send({ message: serverError });
  }

  if (existed) {
    return res.status(409).send({ message: alreadyExist });
  }

  let hashedPassword: any, salt: string | number;
  try {
    salt = await bcrypt.genSalt(12);
    hashedPassword = await bcrypt.hash(password, salt);
  } catch (error) {
    return res.status(500).send({
      message: serverError,
    });
  }
  const user = new User({
    firstName,
    lastName,
    phoneNumber,
    email,
    password: hashedPassword,
    isAdmin
  });
  try {
    await user.save();
  } catch (error) {
    return res.status(500).send({
      message: serverError,
    });
  }
  res.status(201).json({
    message: newUserSuccess,
    user,
  });
};

//User Authentication
export const auth = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  let user: any;
  try {
    user = await User.findOne({ email });
  } catch (error) {
    return res.status(500).send({
      message: serverError,
    });
  }

  if (!user || user.length > 0) {
    res.status(404).send({
      message: notFound,
    });
  }

  let isValidPassword;

  try {
    isValidPassword = await bcrypt.compare(password, user.password);
  } catch (error) {
    return res.status(500).send({
      message: serverError,
    });
  }

  if (!isValidPassword) {
    res.status(403).send({
      message: inputError,
    });
  }

  const token: string = jwt.sign(
    {
      userId: user._id,
      userFirstName: user.firstName,
      userLastName: user.lastName,
      userEmail: user.email,
      isAdmin: user.isAdmin
    },
    `${process.env.JWT_KEY}`,
    { expiresIn: "1d" }
  );

  res.status(200).json({
    message: success,
    Token: token,
  });
};

//GET single User Details
export const userDetails = async (req: Request, res: Response) => {
  const userId = req.params.userId;

  let user: string | any;

  try {
    user = await User.findById(userId).select("-password");
  } catch (error) {
    return res.status(500).json({
      message: serverError,
    });
  }

  if (!user || user.length === 0) {
    return res.status(404).json;
  }

  res.status(200).json({
    message: success,
    user,
  });
};

//Edit user details
export const editUser = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: inputError });
  }
  const userId = req.params.userId;
  const { firstName, lastName, phoneNumber } = req.body;

  let user: string | any;
  try {
    user = await User.findById(userId);
  } catch (error) {
    return res.status(500).json({
      message: serverError,
    });
  }

  if (!user || user.length === 0) {
    return res.status(404).send({
      message: notFound,
    });
  }

  user.firstName = firstName || user.firstName;
  user.lastName = lastName || user.lastName;
  user.phoneNumber = phoneNumber || user.phoneNumber;

  try {
    await user.save();
  } catch (error) {
    return res.status(500).json({
      message: serverError,
    });
  }

  res.status(200).json({
    message: success,
    user,
  });
};

//Send reset password link to email
export const resetPasswordLink = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: inputError });
  }
  const { email } = req.body;

  let user: string | any;
  try {
    user = await User.findOne({ email });
  } catch (error) {
    res.status(500).json({
      message: serverError,
    });
  }

  if (!user || user.length === 0) {
    return res.status(404).send({
      message: notFound,
    });
  }

  const token: String = jwt.sign(
    {
      userId: user._id,
      userFirstName: user.firstName,
      userLastName: user.lastName,
      userEmail: user.email,
    },
    `${process.env.PASSWORD_RESET_KEY}`,
    { expiresIn: "20m" }
  );

  let mailgun = mailgunLoader.default({
    apiKey: `${process.env.API_KEY}`,
    domain: `${process.env.DOMAIN}`,
  });

  const data = {
    from: "no reply mail <myyinvest@gmail.com>",
    to: email,
    subject: "Password reset link",
    text: `${req.headers.host}/api/v1/reset-password/${token}`,
  };

  user.updateOne({ resetLink: token }, (err: any, success: any) => {
    if (err) {
      return console.log(err);
    }
    if (success) {
      mailgun.messages().send(data, (err, body) => {
        if (err) {
          return res.status(400).json(console.log(err));
        }
        res.status(200).json({ message: success, body });
      });
    }
  });
};

//Reset password
export const resetPassword = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: inputError });
  }
  const resetPasswordLink = req.params.resetLink;
  const { password } = req.body;
  let user: string | any;
  try {
    user = await User.findOne({ resetLink: resetPasswordLink });
  } catch (error) {
    res.status(500).json({
      message: serverError,
    });
  }

  if (!user || user.length === 0) {
    return res.status(404).send({
      message: notFound,
    });
  }
  res.json({ user });

  let hashedPassword: any, salt: string | number;
  try {
    salt = await bcrypt.genSalt(12);
    hashedPassword = await bcrypt.hash(password, salt);
  } catch (error) {
    return res.status(500).send({
      message: serverError,
    });
  }

  user.password = hashedPassword;
  user.resetLink = "";

  try {
    user.save();
  } catch (error) {
    res.status(500).json({ message: serverError });
  }

  res.status(200).json({ message: success });
};

//Soft delete user
export const softDeleteUser = async (req: Request, res: Response) => {
  const userId = req.params.userId;

  let user: string | any;
  try {
    user = await User.findById(userId);
  } catch (error) {
    return res.status(500).json({
      message: serverError,
    });
  }

  if (!user || user.length === 0) {
    return res.status(404).send({
      message: notFound,
    });
  }

  const trashUser = new Trash({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    deletedFrom: "User-Model",
  });

  try {
    await trashUser.save();
  } catch (error) {
    return res.status(500).json({
      message: serverError,
    });
  }

  try {
    await user.remove();
  } catch (error) {
    return res.status(500).json({
      message: serverError,
    });
  }

  res.status(200).json({
    message: success,
    user,
  });
};


//Search user
export const searchUser = async (req: any, res: Response, next: any) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const sortBy = req.query.sortBy || "createdAt";
  const orderBy = req.query.orderBy || "-1";
  const search = req.query.search;
  const sortQuery = {
    [sortBy]: orderBy,
  };

  const searchQuery = {
    $or: [
      { firstName: new RegExp(String(search), "i") },
      { lastName: new RegExp(String(search), "i") }
    ],
  };

  const retrievedCounts = await User.countDocuments();
  User.countDocuments(searchQuery).then((usersCount) => {
    User.find(searchQuery)
      .sort(sortQuery)
      .limit(limit)
      .skip(page * limit - limit)
      .then((user) => {
        return res.json({
          user,
          pagination: {
            hasPrevious: page > 1,
            prevPage: page - 1,
            hasNext: page < Math.ceil(usersCount / limit),
            next: page + 1,
            currentPage: Number(page),
            total: retrievedCounts,
            limit: limit,
            lastPage: Math.ceil(usersCount / limit),
          },
          links: {
            prevLink: `http://${
              req.headers.host
            }/api/v1/user/searchUser/search?search=${search}&page=${
              page - 1
            }&limit=${limit}`,
            nextLink: `http://${
              req.headers.host
            }/api/v1/user/searchUser/search?search=${search}&page=${
              page + 1
            }&limit=${limit}`,
          },
        });
      })
      .catch((err) => console.log(err));
  });
};
