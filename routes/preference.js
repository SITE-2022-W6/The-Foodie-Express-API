const express = require('express');
const router = express.Router();

const Preference = require("../models/preference")

router.post('/set-preference', async (req, res, next) => {
    try {
        const preference = await Preference.setPreference(parseInt(req.body.userId), req.body.cuisine, parseInt(req.body.rating), parseInt(req.body.ad))
        res.status(200).json( preference )
    } catch(e) {
        next(e)
    }
})

router.get('/favorite-cuisine/:id', async (req, res, next) => {
    try {
        const favoriteCuisine = await Preference.favoriteCuisine(parseInt(req.params.id))
        res.status(200).json( favoriteCuisine )
    } catch(e) {
        next(e)
    }
})

module.exports = router