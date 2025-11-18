// server/src/utils/genAuthToken.js
import jwt from 'jsonwebtoken';

export const generateAuthToken = (user, team, res) => {
  const payload = {
    user_id: user._id,
    role: user.role || 'Leader',
  };
  // include team_id only when team is provided
  if (team && team._id) payload.team_id = team._id;

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });

  // Set cookie (httpOnly)
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // set true in production
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // if cross-site, use 'None' + secure:true
    maxAge: 48 * 60 * 60 * 1000 // 48 hours
  });

  // return token for body as well (frontend may use it)
  return token;
};
