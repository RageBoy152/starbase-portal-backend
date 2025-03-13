require('dotenv').config();
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;


const userSessions = new Map();



function removeSocketUserFromSession(socketId) {
  userSessions.delete(socketId);
}
function addSocketUserToSession(socketId, discordId) {
  userSessions.set(socketId, discordId);
}



const initializePassport = () => {
  passport.use(new DiscordStrategy({
    clientID: process.env.DC_CLIENT_ID,
    clientSecret: process.env.DC_CLIENT_SECRET,
    callbackURL: "http://localhost:5173/auth/callback",
    scope: ["identify"]
  }, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }));


  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));
}



//    CHECK USER AUTHORIZATION    \\

function checkUserAuthorization(socketId) {
  const userIdFromSession = userSessions.get(socketId);
  const onWhitelist = process.env.AUTHORIZED_USER_IDS.split(',').includes(userIdFromSession);

  return userIdFromSession && onWhitelist;
}



//    GET USER DATA FROM ACCESS TOKEN    \\

async function verifyUser(accessToken) {
  try {
    const response = await fetch('https://discord.com/api/v10/users/@me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    // not ok response
    if (!response.ok) { return { message: 'Failed to fetch user data from Discord', error: response.status } }

    // return discord user data
    const userData = await response.json();
    return userData;

  } catch (error) {
    return { message: 'Failed to verify user', error: error }
  }
}



module.exports = {
  initializePassport,
  checkUserAuthorization,
  verifyUser,
  removeSocketUserFromSession,
  addSocketUserToSession
}