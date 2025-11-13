// server/src/utils/genAuthToken.js
import jwt from 'jsonwebtoken';

export const generateAuthToken = (user, team, res) => {
  const token = jwt.sign(
    { user_id: user._id, team_id: team._id, role: user.role || 'Leader' },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  // Set cookie (httpOnly)
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // set true in production
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // if cross-site, use 'None' + secure:true
    maxAge: 2 * 60 * 60 * 1000 // 2 hours
  });

  // return token for body as well (frontend may use it)
  return token;
};
