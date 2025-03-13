const { removeSocketUserFromSession } = require('../auth');


const utilityListeners = (io, socket) => {
  //    GET OAUTH URL    \\
  
  socket.on("request_oauth", (callbackUrl) => {
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DC_CLIENT_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=identify`;
    socket.emit("oauth_url", discordAuthUrl);
  });
  
  
  
  //   DISCONNECT    \\
  
  socket.on('disconnect', () => { removeSocketUserFromSession(socket.id); });
}



module.exports = utilityListeners;