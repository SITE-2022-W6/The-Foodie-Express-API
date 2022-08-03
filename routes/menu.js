const express = require('express');
const Menu = require('../models/menu');
const router = express.Router();

router.get('/', async (req, res) => {
    res.status(200).json({ ping: 'menu' });
})

//Get information about a specific menu item
router.get('/item', async (req,res,next) => {
    try {
        const item = await Menu.getMenuItem(req.query.restaurantId, req.query.itemName)
        return res.status(200).json({ item })
    }
    catch (err) {
        next(err)
    }
})

//Get average rating of a menu item
router.get('/rating', async (req, res, next) => {
    try{
        const average = await Menu.getAverageRating(req.query.restaurantId, req.query.itemName)
        return res.status(200).json({ average })

    }
    catch(err) {
        next(err)
    }
})

module.exports = router;