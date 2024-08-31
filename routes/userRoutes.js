const express = require('express');
const userController = require('./../controller/userController');
const authController = require('./../controller/authController');

module.exports = userRouter = express.Router();

userRouter.post('/signup', authController.signUp);
userRouter.post('/login', authController.login);
userRouter.get('/logout', authController.logout);
userRouter.post('/forgotPassword', authController.forgotPassword);
userRouter.patch('/resetPassword/:token', authController.resetPassword);

userRouter.use(authController.protect);

userRouter.patch('/updatePassword', authController.updatePassword);
userRouter.delete('/deleteMe', userController.deleteMe);
userRouter.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeImage,
  userController.updateMe
);
userRouter.get('/me', userController.getMe, userController.getUser);

userRouter.use(authController.restrictTo('admin'));

userRouter.route('/').get(userController.getAllUsers);

userRouter
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);
