const { promisify } = require('util');
const crypto = require('crypto');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const Email = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRED_IN,
  });
};

const cookieOptions = {
  expires: new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRED_IN * 24 * 60 * 60 * 1000
  ),
  httpOnly: true,
};

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  sendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check email and password is provided from client
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Check email and password matched
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // If all true, create token
  sendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  // Check there is a token in the headers
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token)
    return next(
      new AppError('You are not logged in! Please login to get access', 401)
    );

  let decoded;

  // Token verification
  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  } catch (err) {
    return next();
  }

  // Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('User who belongs to this token no longer exist', 401)
    );
  }

  // Check if password is changed
  if (await currentUser.passwordChangedCheck(decoded.iat))
    return next(
      new AppError('Password is changed after the token is issued', 401)
    );

  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  // Check there is a token in the cookies

  try {
    if (req.cookies.jwt) {
      // Token verification
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // Check if password is changed
      if (await currentUser.passwordChangedCheck(decoded.iat)) return next();

      res.locals.user = currentUser;
      return next();
    }
  } catch (err) {
    return next();
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You don't have permission to perform this action", 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError("User with provided email adress doesn't exist!"),
      404
    );
  }

  const resetToken = user.createResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH requrest with your new password and passwordConfirm to: ${resetURL}.\n If you didn\'t forget password, please ignore this message`;
  try {
    await new Email(user, resetURL).sendPasswordReset();
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token <valid for 10 mins>',
    //   message,
    // });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    console.log(err);
    user.passwordResetToken = undefined;
    user.resetTokenExpire = undefined;
    await user.save({ validateBeforeSave: false });

    next(
      new AppError(
        'There was an error sending the email. Please try again later',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    resetTokenExpire: { $gt: Date.now() },
  });

  if (!user) return next(new AppError('Token is invalid or has expired', 400));

  user.password = req.body.password;
  user.confirmedPassword = req.body.confirmedPassword;
  user.passwordResetToken = undefined;
  user.resetTokenExpire = undefined;
  await user.save();
  sendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  let user = await User.findById(req.user._id).select('+password');

  const { password, newPassword, confirmedPassword } = req.body;

  if (!(await user.correctPassword(password, user.password)))
    return next(new AppError('Your current password is wrong', 401));

  user.password = newPassword;
  user.confirmedPassword = confirmedPassword;
  user = await user.save();
  sendToken(user, 200, res);
});
