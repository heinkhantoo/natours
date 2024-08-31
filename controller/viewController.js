const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();
  res.status(200).render('overview', {
    title: 'All tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'rating review user',
  });

  res.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});

exports.myTours = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id });

  const myTours = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: myTours } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

exports.login = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
});

exports.account = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};
