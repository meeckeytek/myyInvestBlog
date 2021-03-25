import { Router } from "express";
import * as blogController from "../Controllers/blogController";
import { check } from "express-validator";
import upload from "../middlewares/uploads";
import { isAdmin, isAuth } from "../middlewares/util";
const blogRouter = Router();

//Default route
blogRouter.get("/", blogController.defaultRoute);

// Get all posts
blogRouter.get("/allPosts", blogController.getAllPosts);

// Get all softDeleted Posts
blogRouter.get("/softDelete", isAuth, isAdmin, blogController.softDelPosts);

// Add new post
blogRouter.post(
  "/newPost",
  upload.single("image"),
  isAuth,
  [check("title").not().isEmpty(), check("body").not().isEmpty()],
  blogController.newPost
);

// Get single post
blogRouter.get("/:postId", isAuth, blogController.postDetails);

// Edit Post
blogRouter.patch(
  "/editPost/:postId",
  upload.single("image"),
  isAuth,
  isAdmin,
  [check("title").not().isEmpty(), check("body").not().isEmpty()],
  blogController.editPost
);

// Add Comment to post
blogRouter.patch(
  "/comment/:postId",
  isAuth,
  check("comment").not().isEmpty(),
  blogController.commentPost
);

// Like a post
blogRouter.patch("/likePost/:postId", isAuth, blogController.likePost);

//Search User
blogRouter.get("/searchPost/search", blogController.searchPost);

// Soft Delete Post
blogRouter.delete("/softDelete/:postId", isAuth, blogController.softDeletePost);

export default blogRouter;
