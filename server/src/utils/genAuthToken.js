// server/src/utils/genAuthToken.js
import jwt from 'jsonwebtoken';

export const generateAuthToken = (user, team, res) => {
  const payload = {
    user_id: user.id || user._id, // Use `user.id` as a fallback
    role: user.role || 'Leader',
  };

  if (team && team._id) payload.team_id = team._id;

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: 50 * 24 * 60 * 60, // 50 days in seconds
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 50 * 24 * 60 * 60 * 1000, // 50 days in milliseconds
  });

  return token;
};

export function createPresentToken(admitCardId) {
  return jwt.sign(
    { type: 'admit_present', admitCardId },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );
}

export function verifyPresentToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
