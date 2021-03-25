import { Request, Response } from "express";
import path from "path";
import User from "../models/user.model";
import Trash from "../models/trash.model";
import Blog from "../models/blog.model";
import cloudinary from "../middlewares/cloudinary";
import { validationResult } from "express-validator";

//Output Messages
const notFound: any = {
  status: "Failed",
  code: 404,
  Message: "End point returned not found",
};

const alreadyExist: any = {
  status: "Failed",
  code: 409,
  Message: "Already exist",
};

const serverError: any = {
  status: "Failed",
  code: 500,
  Message: "Something went wrong, Please try again later",
};

const success: any = {
  status: "Success",
  code: 200,
  Message: "End point returned successfully",
};

const inputError: any = {
  status: "Failed",
  code: 422,
  Message: "Please check all inputs for validity",
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
  Message: "Myyinvest tech intern (Blog API)",
};

// Default Route
export const defaultRoute = async (req: Request | any, res: Response) => {
  res.status(200).json({ message: defaultMsg });
};

// Get all posts
export const getAllPosts = async (req: Request | any, res: Response) => {
  const page: number = parseInt(req.query.page) || 1;
  const limit: number = parseInt(req.query.limit) || 10;
  const sortBy: string = req.query.sortBy || "createdAt";
  const orderBy: any = req.query.orderBy || "-1";
  const sortQuery: any = {
    [sortBy]: orderBy,
  };

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const results: any = {};

  if (endIndex < (await Blog.countDocuments().exec())) {
    results.nextPageLink = {
      nextPage: `${
        req.headers.host
      }/api/v1/user/allPosts?sortBy=${sortBy}&page=${page + 1}&limit=${limit}`,
    };
  }

  if (startIndex > 0) {
    results.previousPageLink = {
      previousPage: `${
        req.headers.host
      }/api/v1/user/allPosts?sortBy=${sortBy}&page=${page - 1}&limit=${limit}`,
    };
  }

  try {
    results.results = await Blog.find()
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
};

// Get all deleted posts
export const softDelPosts = async (req: Request | any, res: Response) => {
  const page: number = parseInt(req.query.page);
  const limit: number = parseInt(req.query.limit);
  const sortBy: string = req.query.sortBy || "createdAt";
  const orderBy: any = req.query.orderBy || "-1";
  const sortQuery: any = {
    [sortBy]: orderBy,
  };

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const results: any = {};

  if (endIndex < (await Trash.countDocuments().exec())) {
    results.nextPageLink = {
      nextPage: `${
        req.headers.host
      }/api/v1/user/softDelete?sortBy=${sortBy}&page=${
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
    results.results = await Trash.find({ deletedFrom: "Blog-Model" })
      .select(["-firstName", "-lastName", "-phoneNumber", "-email"])
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
};

//Add new post
export const newPost = async (req: Request | any, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: inputError });
  }
  const { title, body } = req.body;
  let post: any;
  try {
    const uploadedPost = await cloudinary.uploader.upload(req.file.path, {
      upload_preset: "blogIMG",
    });
    post = new Blog({
      image: uploadedPost.secure_url,
      title,
      body,
      creator: req.user.userId,
      cloudinary_id: uploadedPost.public_id,
      comments: [],
      likes: [],
    });
    await post.save();
  } catch (error) {
    return res.status(500).send({});
  }
  res.status(201).json({
    message: newUserSuccess,
    post,
  });
};

//GET single User Details
export const postDetails = async (req: Request | any, res: Response) => {
  const postId = req.params.postId;

  let post: any;
  let count: any;

  try {
    post = await Blog.findById(postId);
  } catch (error) {
    return res.status(500).json({
      message: serverError,
    });
  }

  if (!post || post.length === 0) {
    return res.status(404).json;
  }

  try {
    count = await Blog.find({ count: req.user.userId });
  } catch (error) {
    return res.status(500).json({
      message: serverError,
    });
  }

  if (count.length === 0) {
    try {
      await Blog.findByIdAndUpdate(postId, {
        $push: { count: req.user.userId },
      });
    } catch (error) {
      return res.status(500).json({
        message: serverError,
      });
    }
  }

  res.status(200).json({
    message: success,
    post,
  });
};

//Comment on a post
export const commentPost = async (req: Request | any, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: inputError });
  }
  const postId = req.params.postId;
  const { comment } = req.body;

  let post: string | any;
  try {
    post = await Blog.findById(postId);
  } catch (error) {
    return res.status(500).json({
      message: serverError,
    });
  }

  if (!post || post.length === 0) {
    return res.status(404).send({
      message: notFound,
    });
  }

  let newComment = {
    comment: comment,
    username: req.user.userLastName,
    timestamps: new Date(),
  };

  if (!newComment) {
    return res.status(422).json({ message: inputError });
  }

  try {
    await Blog.findByIdAndUpdate(postId, { $push: { comments: newComment } });
  } catch (error) {
    return res.status(500).json({
      message: serverError,
    });
  }

  res.status(200).json({ message: success });
};

//Like a post
export const likePost = async (req: Request | any, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: inputError });
  }
  const postId = req.params.postId;
  const { comment } = req.body;

  let post: string | any;
  let liked: string | any;
  try {
    post = await Blog.findById(postId);
  } catch (error) {
    return res.status(500).json({
      message: serverError,
    });
  }

  if (!post || post.length === 0) {
    return res.status(404).send({
      message: notFound,
    });
  }

  try {
    liked = await Blog.find({ likes: req.user.userId });
  } catch (error) {
    return res.status(500).json({
      message: serverError,
    });
  }

  if (!liked || liked.length > 0) {
    return res.status(409).json({ message: alreadyExist });
  }

  try {
    await Blog.findByIdAndUpdate(postId, { $push: { likes: req.user.userId } });
  } catch (error) {
    return res.status(500).json({
      message: serverError,
    });
  }

  res.status(200).json({ message: success });
};

//Edit post
export const editPost = async (req: Request | any, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: inputError });
  }
  const postId = req.params.postId;
  const { title, body } = req.body;

  let post: string | any;
  try {
    post = await Blog.findById(postId);
  } catch (error) {
    return res.status(500).json({
      message: serverError,
    });
  }

  if (!post || post.length === 0) {
    return res.status(404).send({
      message: notFound,
    });
  }

  try {
    await cloudinary.uploader.destroy(post.cloudinary_id);
    const result = await cloudinary.uploader.upload(req.file.path, {
      upload_preset: "blogIMG",
    });

    post.image = result.secure_url || post.image;
    post.title = title || post.title;
    post.body = body || post.body;
    post.cloudinary_id = result.public_id || post.cloudinary_id;

    await post.save();
  } catch (error) {
    return res.status(500).json({
      message: serverError,
    });
  }

  res.status(200).json({
    message: success,
    post,
  });
};

//Soft delete post
export const softDeletePost = async (req: Request, res: Response) => {
  // const postId = req.params.postId;

  // let post: string | any;
  // try {
  //   post = await Blog.findById(postId);
  // } catch (error) {
  //   return res.status(500).json({
  //     message: serverError,
  //   });
  // }

  // if (!post || post.length === 0) {
  //   return res.status(404).send({
  //     message: notFound,
  //   });
  // }

  // console.log(post)

  // const trashBlog = new Trash({
  //   image: post.image,
  //   title: post.title,
  //   body: post.body,
  //   count: post.count,
  //   likes: post.likes,
  //   creator: post.creator,
  //   cloudinary_id: post.cloudinary_id,
  //   comments: post.comments,
  //   deletedFrom: "Blog-Model",
  // });

  // try {
  //   await trashBlog.save();
  // } catch (error) {
  //   return res.status(500).json({
  //     message: serverError,
  //   });
  // }

  // try {
  //   await post.remove();
  // } catch (error) {
  //   return res.status(500).json({
  //     message: serverError,
  //   });
  // }

  // res.status(200).json({
  //   message: success,
  //   post,
  // });
  res.json({message:'welcome'})
};

export const searchPost = async (req: any, res: Response, next: any) => {
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
      { title: new RegExp(String(search), "i") },
      { body: new RegExp(String(search), "i") },
    ],
  };

  const retrievedCounts = await Blog.countDocuments();
  Blog.countDocuments(searchQuery).then((postsCount) => {
    Blog.find(searchQuery)
      .sort(sortQuery)
      .limit(limit)
      .skip(page * limit - limit)
      .then((post) => {
        return res.json({
          post,
          pagination: {
            hasPrevious: page > 1,
            prevPage: page - 1,
            hasNext: page < Math.ceil(postsCount / limit),
            next: page + 1,
            currentPage: Number(page),
            total: retrievedCounts,
            limit: limit,
            lastPage: Math.ceil(postsCount / limit),
          },
          links: {
            prevLink: `http://${
              req.headers.host
            }/api/v1/blog/searchPost/search?search=${search}&page=${
              page - 1
            }&limit=${limit}`,
            nextLink: `http://${
              req.headers.host
            }/api/v1/blog/searchPost/search?search=${search}&page=${
              page + 1
            }&limit=${limit}`,
          },
        });
      })
      .catch((err) => console.log(err));
  });
};
