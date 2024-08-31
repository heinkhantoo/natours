const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const multer = require('multer');
const sharp = require('sharp');
const factory = require('./../controller/handlerFactory');
const AppError = require('../utils/appError');
const { promises } = require('nodemailer/lib/xoauth2');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload an image.', 401), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImage = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeImage = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    })
  );

  next();
});

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, 'reviews');
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.Top5Alias = catchAsync(async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,ratingsAverage,price,difficulty,summary,duration';
  next();
});

exports.tourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        _id: '$difficulty',
        numTour: { $sum: 1 },
        tourRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        maxPrice: { $max: '$price' },
        minPrice: { $min: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.tourMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        tourQty: { $sum: 1 },
        name: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: {
        tourQty: -1,
      },
    },
    {
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

exports.getWithIn = catchAsync(async (req, res, next) => {
  const { distance, latlgn, unit } = req.params;
  const [lat, lgn] = latlgn.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lgn) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format of lat,lgn',
        400
      )
    );
  }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lgn, lat], radius] } },
  });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistance = catchAsync(async (req, res, next) => {
  const { latlgn, unit } = req.params;
  const [lat, lgn] = latlgn.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lgn) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format of lat,lgn',
        400
      )
    );
  }

  const distance = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lgn * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distance,
    },
  });
});
