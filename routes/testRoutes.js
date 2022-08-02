const express = require('express');
const router = express.Router();

const User = require("../models/user")

router.post('/preference', async (req, res, next) => {
    try {
        const pref = await User.addPreference(req.body.userId, req.body.cuisine, req.body.rating)
        res.status(200).json({pref})
    } catch(e) {
        next(e)
    }
})

router.post('/recommend', async (req, res, next) => {
    try {
        const rec = await User.recommend(req.body.userId)
        res.status(200).json({rec})
    } catch(e) {
        next(e)
    }
})

module.exports = router