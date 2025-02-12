const { Server } = require ("socket.io");
const mongoose = require('mongoose');
const dotenv = require("dotenv").config();

const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;


const Object = require('./models/Object');



//    MONGOOSE CONNECTION    \\

const dbURI = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PWD}@starbaseportaldb.nzcri.mongodb.net/?retryWrites=true&w=majority&appName=StarbasePortalDB`;

mongoose.connect(dbURI)
  .then((res) => {
    console.log("Connected to database.");
    
    //  start socket.io server
    try {
      io.listen(process.env.SOCKET_PORT);
      console.log(`Socket.IO listening on http://localhost:${process.env.EXPRESS_PORT}`);
    } catch (err) {
      console.error(`Error starting Socket.IO server: ${err}`);
    }
  })
  .catch((err) => {
    console.log(`Error connecting to database. ${err}`);
  });



//    CONFIG SOCKET.IO SERVER    \\

const io = new Server({
  cors: {
    origin: ['http://localhost:5173']
  }
});



//    CONFIG EXPRESS.JS SERVER    \\

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  exposedHeaders: ['Set-Cookie']
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(process.env.EXPRESS_PORT, () => console.log(`Express.JS listening on http://localhost:${process.env.EXPRESS_PORT}`));



//    CONFIG DISCORD BOT    \\

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



//    CONFIG AUTHORIZATION    \\

const authorizedUserIds = ['693191740961718420'];        // team member discord IDs
const userSessions = new Map();                                   // this does fuck all coz server can restart anytime and clears sessions



//    CHECK USER AUTHORIZATION    \\

function checkUserAuthorization(socketId) {
  const userIdFromSession = userSessions.get(socketId);
  const onWhitelist = authorizedUserIds.includes(userIdFromSession);

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



//    GET USER ACCESS TOKEN    \\

app.post('/auth/exchange_code', async (req, res) => {
  const { code } = req.body;  // This would be passed from the frontend

  if (!code) {
    return res.status(400).json({ message: 'No code provided.', error: 400 });
  }

  try {
    // Step 1: Exchange the code for an access token
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

    // Step 2: Set the access token in the cookie and send res
    const accessToken = tokenData.access_token;

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      expires: new Date(Date.now() + 3600000),
      path: '/'
    });
    
    res.status(200)
    .json({ message: 'Authenticated successfully.' });

  } catch (error) {
    res.status(500).json({ message: 'Error handling the exchange request.', error: error });
  }
});



//    CHECK USER AUTH    \\

app.get('/auth/check', async (req, res) => {
  try {
    const accessToken = req.cookies.access_token;

    // no access token
    if (!accessToken) return res.status(401).json({ message: 'No token found.', error: 401 });

    // get user data with access token
    const user = await verifyUser(accessToken);

    // error verifying user
    if (user.error) return res.status(500).json(user);

    // check for userID in whitelist
    if (!authorizedUserIds.includes(user.id)) return res.status(403).json({ message: 'User not authorized.', error: 401 });

    // send back user data
    res.json({ id: user.id, username: user.global_name, avatar: user.avatar });
  } catch (error) {
    res.status(500).json({ message: 'Session invalid or expired', error: error });
  }
});



//    LOGOUT USER    \\

app.get('/auth/logout', async (req, res) => {
  try {
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







io.on('connection', socket => {

  //    GET OAUTH URL    \\

  socket.on("request_oauth", (callbackUrl) => {
      const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DC_CLIENT_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=identify`;
      socket.emit("oauth_url", discordAuthUrl);
  });



  //    ADD USERID TO SESSION MAP    \\

  socket.on('authenticate', (userId) => {
    if (authorizedUserIds.includes(userId)) {
      userSessions.set(socket.id, userId);
    } else {
      socket.emit('auth_error', { message: 'User not authorized.', error: 401 });
    }
  });



  //    LOGOUT / DISCONNECT    \\

  socket.on('logout', () => userSessions.delete(socket.id));
  socket.on('disconnect', () => userSessions.delete(socket.id));



  //    FETCH OBJECTS FUNC    \\

  async function fetchObjects(reqSocket, idSelector, moving, updateSingle) {
    let resultSocket = idSelector ? reqSocket : reqSocket ? reqSocket : moving ? socket.broadcast : io;

    // console.log(moving);
    // console.log(idSelector ? 'reqSocket' : reqSocket ? 'reqSocket' : moving ? 'socket.broadcast' : 'io');



    Object.find(idSelector ? { id: idSelector } : {})
    .then(dbRes => {
      resultSocket.emit('objectsFetchRes', dbRes, updateSingle);
    })
    .catch(err => {
      let errMsg = "DB error on 'objectsFetchReq'";

      console.log(`${errMsg}. ${err}`);
      reqSocket.emit('objectsFetchRes', { error_message: errMsg, error: err });
    });
  }



  //    FETCH OBJECT LISTENERS    \\

  socket.on('objectsFetchReq', function () { fetchObjects(this); });
  socket.on('objectFetchFromIdReq', function (id) { fetchObjects(this, id); });



  //    ADD OBJECT    \\

  socket.on('addNewObject', async function (newObject) {
    if (!checkUserAuthorization(socket.id)) { return socket.emit('auth_error', { message: 'Unauthorized action.', error: 403 }); }


    const NewObject = new Object(newObject);

    NewObject.save()
    .then(dbRes => {
      fetchObjects();
    })
    .catch(err => {
      let errMsg = "DB error on 'addNewObject'";

      console.log(`${errMsg}. ${err}`);
      io.sockets.emit('objectsFetchRes', { error_message: errMsg, error: err });
    });
  });



  //    DELETE OBJECT    \\

  socket.on('deleteObject', async function (objectId) {
    if (!checkUserAuthorization(socket.id)) { return socket.emit('auth_error', { message: 'Unauthorized action.', error: 403 }); }


    Object.findOneAndDelete({ id: objectId })
    .then(dbRes => {
      fetchObjects();
    })
    .catch(err => {
      let errMsg = "DB error on 'deleteObject'";

      console.log(`${errMsg}. ${err}`);
      io.sockets.emit('objectsFetchRes', { error_message: errMsg, error: err });
    });
  });



  //    UPDATE OBJECT    \\
  
  socket.on('updateObject', async function (object, moving, updateSingle, save) {
    if (!checkUserAuthorization(socket.id)) { return socket.emit('auth_error', { message: 'Unauthorized action.', error: 403 }); }


    if (save) {
      Object.findOneAndUpdate({ id: object.id }, object)
      .then(dbRes => {
        fetchObjects(null, null, moving, updateSingle);
      })
      .catch(err => {
        let errMsg = "DB error on 'updateObject'";
  
        console.log(`${errMsg}. ${err}`);
        io.sockets.emit('objectsFetchRes', { error_message: errMsg, error: err });
      });
    }
    else {
      socket.broadcast.emit('objectsFetchRes', object, updateSingle);   // send this object to all clients and let them know to only update this object on their end
    }
  });

});