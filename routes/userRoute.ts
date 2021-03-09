import {Router} from 'express'
import * as userController from '../Controllers/userController'
import {check} from 'express-validator'
import paginatedResults from '../middlewares/pagination';
import User from '../models/user';
const userRouter = Router();

//Default route
userRouter.get('/', userController.defaultRoute);

// Get all users
userRouter.get('/allUsers', userController.getUser);

// Get all softDeleted Users
userRouter.get('/softDelete', userController.softDelUsers);

// Register new user
userRouter.post('/newUser',[
    check('firstName')
    .not()
    .notEmpty(),
    check('lastName')
    .not()
    .notEmpty(),
    check('email')
    .normalizeEmail()
    .isEmail(),
    check('password')
    .isLength({min: 6}),
    check('phoneNumber')
    .isNumeric()
    .isLength({min:11})
], userController.newUser);

// Get single user details
userRouter.get('/:userId', userController.userDetails);

// User Authentication
userRouter.post('/auth', userController.auth);

// Edit User Details
userRouter.patch('/editUser/:userId',[
    check('firstName')
    .not()
    .notEmpty(),
    check('lastName')
    .not()
    .notEmpty(),
    check('phoneNumber')
    .isNumeric()
    .isLength({min:11})
], userController.editUser)

//Search User
userRouter.post('/search', userController.searchUser)

// Send user reset password link
userRouter.post('/resetPasswordLink',[
    check('email')
    .normalizeEmail()
    .isEmail(),
], userController.resetPasswordLink)


// Reset Password
userRouter.patch('/resetPassword/:resetLink',[
    check('password')
    .isLength({min: 6}),
], userController.resetPassword)

// Soft Delete User
userRouter.delete('/softDelete/:userId', userController.softDeleteUser)


export default userRouter;