// server/src/modules/auth/auth.service.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../users/user.model');
const env = require('../../config/env');
const { AppError } = require('../../utils/AppError');

const signAccess = (user) =>
  jwt.sign({ sub: user._id || user.id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

const signRefresh = (user) =>
  jwt.sign({ sub: user._id || user.id, jti: crypto.randomUUID() }, env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });

const sha256 = (str) => crypto.createHash('sha256').update(str).digest('hex');

/**
 * Issues fresh access and rotating refresh tokens for a user
 */
async function issueTokens(user, userAgent = '') {
  const refreshToken = signRefresh(user);
  const tokenHash = sha256(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  user.refreshTokens = user.refreshTokens || [];
  // Prune expired tokens while adding new one
  user.refreshTokens = user.refreshTokens.filter((rt) => new Date(rt.expiresAt) > new Date());
  user.refreshTokens.push({ tokenHash, userAgent, expiresAt });

  await user.save();

  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.passwordHash;
  delete userObj.refreshTokens;

  return {
    user: userObj,
    accessToken: signAccess(user),
    refreshToken,
  };
}

/**
 * Register a new user account
 */
async function register({ name, email, password }, userAgent) {
  const exists = await User.findOne({ email });
  if (exists) {
    throw new AppError(409, 'An account with this email address already exists', 'EMAIL_TAKEN');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    passwordHash,
  });

  return issueTokens(user, userAgent);
}

/**
 * Login an existing user
 */
async function login({ email, password }, userAgent) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw new AppError(401, 'Invalid email or password', 'BAD_CREDENTIALS');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError(401, 'Invalid email or password', 'BAD_CREDENTIALS');
  }

  return issueTokens(user, userAgent);
}

/**
 * Rotate refresh token and issue new 15m access token with theft detection
 */
async function refreshSession(refreshTokenString, userAgent = '') {
  if (!refreshTokenString) {
    throw new AppError(401, 'Refresh token cookie is missing', 'NO_REFRESH_TOKEN');
  }

  let payload;
  try {
    payload = jwt.verify(refreshTokenString, env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new AppError(401, 'Refresh token has expired or is invalid', 'TOKEN_EXPIRED');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw new AppError(401, 'User account associated with this session no longer exists', 'USER_NOT_FOUND');
  }

  const incomingHash = sha256(refreshTokenString);
  const tokenRecordIndex = user.refreshTokens.findIndex((t) => t.tokenHash === incomingHash);

  // TOKEN THEFT DETECTION: If a valid JWT refresh token is presented but not found in active tokens,
  // it has likely been stolen and reused. Revoke ALL active user sessions immediately.
  if (tokenRecordIndex === -1) {
    user.refreshTokens = [];
    await user.save();
    throw new AppError(
      401,
      'Security alert: Attempted token reuse detected. All active sessions have been revoked.',
      'TOKEN_REUSE_DETECTED'
    );
  }

  // Remove the consumed refresh token
  user.refreshTokens.splice(tokenRecordIndex, 1);

  // Generate new rotated refresh token
  const newRefreshToken = signRefresh(user);
  const newHash = sha256(newRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  user.refreshTokens.push({ tokenHash: newHash, userAgent, expiresAt });
  await user.save();

  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.passwordHash;
  delete userObj.refreshTokens;

  return {
    user: userObj,
    accessToken: signAccess(user),
    refreshToken: newRefreshToken,
  };
}

/**
 * Invalidate refresh token on logout
 */
async function logoutSession(refreshTokenString, userId) {
  if (refreshTokenString && userId) {
    const hash = sha256(refreshTokenString);
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: { tokenHash: hash } },
    });
  }
}

/**
 * Retrieve user profile
 */
async function getCurrentUser(userId) {
  const user = await User.findById(userId).select('-refreshTokens');
  if (!user) {
    throw new AppError(404, 'User not found', 'NOT_FOUND');
  }
  return user;
}

module.exports = {
  register,
  login,
  refreshSession,
  logoutSession,
  getCurrentUser,
  issueTokens,
  signAccess,
  signRefresh,
};
