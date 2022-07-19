const express = require('express');
const router = express.Router();

const Restaurant = require("../models/restaurant")

// Find restaurant info provided an ID, if no
router.get('/:id', async (req, res, next) => {
    try {
        const restaurant = await Restaurant.getRestaurantById(req.params.id)
        return res.status(200).json({ restaurant })
    }catch (err) {
        next(err)
    }
})

router.get('/:OpenMenuId', async (req, res, next) => {
    try {
        const restaurant = await Restaurant.getRestaurantByOpenMenuId(req.params.OpenMenuId)
        return res.status(200).json({ restaurant })
    } catch(err) {
        next(err)
    }
})


module.exports = router;
