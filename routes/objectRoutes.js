const express = require('express');
const router = express.Router();
const Object = require('../models/Object');



//    FETCH OBJECT(S)    \\

router.get('/fetch-objects', (req, res) => {
  try {
    const selector = req.query.id;


    Object.find(selector ? { id: selector } : {})
    .then(dbRes => {
      res.json(selector ? dbRes[0] : dbRes);
    })
    .catch(err => {
      let errMsg = "DB error on 'objectsFetchReq'";
  
      console.error(`${errMsg}. ${err}`);
      res.status(500).json({ error_message: errMsg, error: err });
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error fetching object(s).', error: error });
  }
});



module.exports = router;