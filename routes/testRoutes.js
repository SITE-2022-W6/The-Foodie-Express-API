const express = require('express');
const router = express.Router();

const User = require("../models/user")

router.get()

router.post('/preference', async (req, res, next) => {
    try {
        const pref = await User.addPreference()
        res.status(200).json({pref})
    } catch(e) {
        next(e)
    }
})

module.exports = router