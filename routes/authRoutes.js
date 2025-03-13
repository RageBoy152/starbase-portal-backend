require('dotenv').config();
const express = require('express');
const router = express.Router();
const { verifyUser, addSocketUserToSession, removeSocketUserFromSession } = require('../auth');



//    GET USER ACCESS TOKEN    \\

router.post('/exchange_code', async (req, res) => {
  const { code } = req.body;  // This would be passed from the frontend

  if (!code) {
    return res.status(400).json({ message: 'No code provided.', error: 400 });
  }

  try {
    // exchange the code for an access token
    const tokenResponse = await fetch(`https://discord.com/api/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.DC_CLIENT_ID,
        client_secret: process.env.DC_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: 'http://localhost:5173/auth/callback',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.status(400).json({ message: 'Error exchanging code for access_token.', error: tokenData.error });
    }

    // set the access token in the cookie and send res

    res.cookie('access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      expires: new Date(Date.now() + 2419200000),
      path: '/'
    });
    
    res.status(200)
    .json({ message: 'Authenticated successfully.' });

  } catch (error) {
    res.status(500).json({ message: 'Error handling the exchange request.', error: error });
  }
});



//    CHECK USER AUTH    \\

router.get('/check', async (req, res) => {
  try {
    const accessToken = req.cookies.access_token;
    const socketId = req.query.socketId

    // no access token
    if (!accessToken) return res.status(401).json({ message: 'No token found.', error: 401 });

    // get user data with access token
    const user = await verifyUser(accessToken);

    // error verifying user
    if (user.error) return res.status(500).json(user);

    // check for userID in whitelist
    if (!process.env.AUTHORIZED_USER_IDS.split(',').includes(user.id)) return res.status(403).json({ message: 'User not authorized.', error: 401 });

    // add socket user to session list
    addSocketUserToSession(socketId, user.id);

    // send back user data
    res.json({ id: user.id, username: user.global_name, avatar: user.avatar });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error checking user auth', error: error });
  }
});



//    LOGOUT USER    \\

router.get('/logout', async (req, res) => {
  try {
    // remove socket user from session
    removeSocketUserFromSession(req.query.socketId)


    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/'
    });


    res.status(200).json({ message: 'Logged out.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error requesting logout.', error: error });
  }
});



module.exports = router;