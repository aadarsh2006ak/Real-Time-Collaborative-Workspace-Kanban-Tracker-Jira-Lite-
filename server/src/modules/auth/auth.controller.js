// server/src/modules/auth/auth.controller.js
const authService = require('./auth.service');
const env = require('../../config/env');

const setRefreshCookie = (res, token) => {
  res.cookie('rt', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie('rt', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
  });
};

exports.register = async (req, res, next) => {
  try {
    const userAgent = req.headers['user-agent'] || '';
    const result = await authService.register(req.valid.body, userAgent);

    setRefreshCookie(res, result.refreshToken);

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const userAgent = req.headers['user-agent'] || '';
    const result = await authService.login(req.valid.body, userAgent);

    setRefreshCookie(res, result.refreshToken);

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.rt;
    const userAgent = req.headers['user-agent'] || '';
    const result = await authService.refreshSession(refreshToken, userAgent);

    setRefreshCookie(res, result.refreshToken);

    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
      },
    });
  } catch (err) {
    clearRefreshCookie(res);
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.rt;
    const userId = req.user?.id;

    await authService.logoutSession(refreshToken, userId);
    clearRefreshCookie(res);

    res.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (err) {
    clearRefreshCookie(res);
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (err) {
    next(err);
  }
};
