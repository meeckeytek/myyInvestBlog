import { Request, Response } from "express";
import Trash from "../models/trash.model";
import Blog from "../models/blog.model";
import Log from "../models/logs.model";
import msg from "../middlewares/Messages";
import cloudinary from "../middlewares/cloudinary";
import { validationResult } from "express-validator";

// Default Route
export const defaultRoute = async (req: Request | any, res: Response) => {
  res.status(200).json({ message: msg.defaultMsg });
};

// Get all posts
export const getAllPosts = async (req: Request | any, res: Response) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const sortBy = req.query.sortBy || "createdAt";
  const orderBy = req.query.orderBy || "-1";
  const sortQuery = {
    [sortBy]: orderBy,
  };



  const retrievedCounts = await Blog.countDocuments();
    Blog.find()
      .sort(sortQuery)
      .limit(limit)
      .skip(page * limit - limit)
      .then((blogs) => {
        return res.json({
          blogs,
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
            prevLink: `http://${req.headers.host}/api/v1/user/allPosts?page=${
              page - 1
            }&limit=${limit}`,
            nextLink: `http://${req.headers.host}/api/v1/user/allPosts?page=${
              page + 1
            }&limit=${limit}`,
          },
        });
      })
      .catch((err) => console.log(err));
 

  const log = new Log({
    user: req.user.userId,
    description: "Viewed all blogs",
  });

  try {
    await log.save();
  } catch (error) {
    return res.status(500).json({ message: msg.serverError });
  }
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
    return res.status(500).send({ message: msg.serverError });
  }
  if (!results || results.length < 0) {
    return res.status(404).send({ message: msg.notFound });
  }

  const log = new Log({
    user: req.user.userId,
    description: "User deleted a post and moved to trash",
  });

  try {
    await log.save();
  } catch (error) {
    return res.status(500).json({ message: msg.serverError });
  }

  res.status(200).json({ message: msg.success, results });
};

//Add new post
export const newPost = async (req: Request | any, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: msg.inputError });
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
      count: [],
    });
    await post.save();
  } catch (error) {
    return res.status(500).send({});
  }

  const log = new Log({
    user: req.user.userId,
    description: "User added new post",
  });

  try {
    await log.save();
  } catch (error) {
    return res.status(500).json({ message: msg.serverError });
  }
  res.status(201).json({
    message: msg.newInputSuccess,
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
      message: msg.serverError,
    });
  }

  if (!post || post.length === 0) {
    return res.status(404).json;
  }

  try {
    count = await Blog.find({ count: req.user.userId });
  } catch (error) {
    return res.status(500).json({
      message: msg.serverError,
    });
  }

  if (count.length === 0) {
    try {
      await Blog.findByIdAndUpdate(postId, {
        $push: { count: req.user.userId },
      });
    } catch (error) {
      return res.status(500).json({
        message: msg.serverError,
      });
    }
  }
  const log = new Log({
    user: req.user.userId,
    description: "User viewed post details",
  });

  try {
    await log.save();
  } catch (error) {
    return res.status(500).json({ message: msg.serverError });
  }

  res.status(200).json({
    message: msg.success,
    post,
  });
};

//Comment on a post
export const commentPost = async (req: Request | any, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: msg.inputError });
  }
  const postId = req.params.postId;

  let post: string | any;
  try {
    post = await Blog.findById(postId);
  } catch (error) {
    return res.status(500).json({
      message: msg.serverError,
    });
  }

  if (!post || post.length === 0) {
    return res.status(404).send({
      message: msg.notFound,
    });
  }

  let newComment = {
    comment: req.body.comment,
    username: req.user.userLastName,
    timestamps: new Date(),
  };

  if (!newComment) {
    return res.status(422).json({ message: msg.inputError });
  }

  try {
    await Blog.findByIdAndUpdate(postId, { $push: { comments: newComment } });
  } catch (error) {
    return res.status(500).json({
      message: msg.serverError,
    });
  }

  const log = new Log({
    user: req.user.userId,
    description: "User comment on a post",
  });

  try {
    await log.save();
  } catch (error) {
    return res.status(500).json({ message: msg.serverError });
  }

  res.status(200).json({ message: msg.success });
};

//Like a post
export const likePost = async (req: Request | any, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: msg.inputError });
  }
  const postId = req.params.postId;
  const { comment } = req.body;

  let post: string | any;
  let liked: string | any;
  try {
    post = await Blog.findById(postId);
  } catch (error) {
    return res.status(500).json({
      message: msg.serverError,
    });
  }

  if (!post || post.length === 0) {
    return res.status(404).send({
      message: msg.notFound,
    });
  }

  try {
    liked = await Blog.find({ likes: req.user.userId });
  } catch (error) {
    return res.status(500).json({
      message: msg.serverError,
    });
  }

  if (!liked || liked.length > 0) {
    return res.status(409).json({ message: msg.alreadyExist });
  }

  try {
    await Blog.findByIdAndUpdate(postId, { $push: { likes: req.user.userId } });
  } catch (error) {
    return res.status(500).json({
      message: msg.serverError,
    });
  }

  const log = new Log({
    user: req.user.userId,
    description: "User liked a post",
  });

  try {
    await log.save();
  } catch (error) {
    return res.status(500).json({ message: msg.serverError });
  }

  res.status(200).json({ message: msg.success });
};

//Edit post
export const editPost = async (req: Request | any, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: msg.inputError });
  }
  const postId = req.params.postId;
  const { title, body } = req.body;

  let post: string | any;
  try {
    post = await Blog.findById(postId);
  } catch (error) {
    return res.status(500).json({
      message: msg.serverError,
    });
  }

  if (!post || post.length === 0) {
    return res.status(404).send({
      message: msg.notFound,
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
      message: msg.serverError,
    });
  }

  const log = new Log({
    user: req.user.userId,
    description: "Admin edited a post",
  });

  try {
    await log.save();
  } catch (error) {
    return res.status(500).json({ message: msg.serverError });
  }

  res.status(200).json({
    message: msg.success,
    post,
  });
};

//Soft delete post
export const softDeletePost = async (req: Request | any, res: Response) => {
  const postId = req.params.postId;

  let post: string | any;
  try {
    post = await Blog.findById(postId);
  } catch (error) {
    return res.status(500).json({
      message: msg.serverError,
    });
  }

  if (!post || post.length === 0) {
    return res.status(404).send({
      message: msg.notFound,
    });
  }

  const trashBlog = new Trash({
    image: post.image,
    title: post.title,
    body: post.body,
    count: post.count,
    likes: post.likes,
    creator: post.creator,
    cloudinary_id: post.cloudinary_id,
    comments: post.comments,
    deletedFrom: "Blog-Model",
  });

  try {
    await trashBlog.save();
  } catch (error) {
    return res.status(500).json({
      message: msg.serverError,
    });
  }

  try {
    await post.remove();
  } catch (error) {
    return res.status(500).json({
      message: msg.serverError,
    });
  }

  const log = new Log({
    user: req.user.userId,
    description: "User deleted a post",
  });

  try {
    await log.save();
  } catch (error) {
    return res.status(500).json({ message: msg.serverError });
  }

  res.status(200).json({
    message: msg.success,
    post,
  });
};

export const searchPost = async (req: any, res: Response, next: any) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const sortBy = req.query.sortBy || "createdAt";
  const orderBy = req.query.orderBy || "-1";
  const search = req.query.search || "";
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

  const log = new Log({
    user: req.user.userId,
    description: "User searched a post",
  });

  try {
    await log.save();
  } catch (error) {
    return res.status(500).json({ message: msg.serverError });
  }
};
