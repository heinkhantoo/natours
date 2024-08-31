const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // For nested routes reviews
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    // EXECUTE QUERY
    const feature = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .fields()
      .pagination();
    // const docs = await feature.query.explain();
    const docs = await feature.query;

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: { data: docs },
    });
  });
exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate({ path: populateOptions });
    const doc = await query;
    if (!doc) {
      return next(new AppError("ID doesn't exist", 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: newDoc,
      },
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError("ID doesn't exist", 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError("ID doesn't exist", 404));
    }
    res.status(204).json({
      status: 'success',
      message: 'Delete successfully',
    });
  });
