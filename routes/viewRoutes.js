const express = require('express');
const viewController = require('./../controller/viewController');
const authController = require('./../controller/authController');
const bookingController = require('./../controller/bookingController');

const viewRouter = express.Router();

viewRouter.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewController.getOverview
);
viewRouter.get(
  '/tour/:slug',
  authController.isLoggedIn,
  viewController.getTour
);
viewRouter.get('/login', authController.isLoggedIn, viewController.login);
viewRouter.get('/me', authController.protect, viewController.account);
viewRouter.get('/my-tours', authController.protect, viewController.myTours);

module.exports = viewRouter;
