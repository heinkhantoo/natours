const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review must have a message'],
    },
    rating: {
      type: Number,
      max: [5, 'Please rate from 1 to 5'],
      min: [1, 'Please rate from 1 to 5'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.select('-__v').populate({ path: 'user', select: 'name photo' });
  next();
});

reviewSchema.statics.calcRatingsAvg = async function (tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour',
        ratingQty: { $sum: 1 },
        ratingsAvg: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].ratingQty,
      ratingsAverage: stats[0].ratingsAvg,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0,
    });
  }
};

reviewSchema.post('save', function () {
  this.constructor.calcRatingsAvg(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  const queryOptions = this.getQuery();
  this.review = await Review.findOne(queryOptions);
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.review.constructor.calcRatingsAvg(this.review.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
