const express = require('express');
const User = require('../models/user');
const router = express.Router();
const { createUserJwt } = require('../utils/tokens');

router.post('/login', async (req, res, next) => {
  try {
    const user = await User.login(req.body);
    const token = createUserJwt(user);
    return res.status(200).json({ user, token });
  } catch (err) {
    next(err);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const user = await User.register(req.body);
    const token = createUserJwt(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
});


router.put('/update', async (req, res, next) => {
  try {
    await User.update(req.query.id, req.query.column, req.body)
    return res.status(200).json({ "Update Status":"Successful"} )
  }
  catch (err)
  {
    next(err)
  }
})

router.get('/user', async (req, res, next) => {
  try {
    const user = await User.fetchUserByEmail(req.query.email)
    return user
  }
  catch (err)
  {
    next(err)
  }
})

router.get('/id', async (req, res, next) => {
  try {
    const user = await User.fetchUserByUserId(req.query.userId);
    return res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
});


module.exports = router;
