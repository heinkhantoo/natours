const express = require('express');
const tourController = require('./../controller/tourController');
const authController = require('./../controller/authController');
const reviewRoutes = require('./../routes/reviewRoutes');

module.exports = tourRouter = express.Router();
// router.param('id', tourController.checkID);

tourRouter.use('/:tourId/reviews', reviewRoutes);

tourRouter
  .route('/top-5-rating')
  .get(tourController.Top5Alias, tourController.getAllTours);

tourRouter.route('/tour-stats').get(tourController.tourStats);
tourRouter
  .route('/tour-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.tourMonthlyPlan
  );

tourRouter
  .route('/location-within/:distance/center/:latlgn/unit/:unit')
  .get(tourController.getWithIn);

tourRouter
  .route('/distances/:latlgn/unit/:unit')
  .get(tourController.getDistance);

tourRouter
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );
tourRouter
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImage,
    tourController.resizeImage,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );
