const express = require('express');
const Menu = require('../models/menu');
const router = express.Router();

router.get('/', async (req, res) => {
    res.status(200).json({ ping: 'menu' });
})

router.get('/:restaurantId', async (req, res, next) => {
    try {
        //Pass in the restaurant id that you want the menu for
        //menu will hold the menu for that restaurant
        const menu = await Menu.getMenu(req.params.restaurantId)
        // console.log(menu)
        return res.status(200).json({ menu })
    }
    catch (err) {
        next(err)
    }
})

//Get information about a specific menu item
router.get('/:restaurantId/:itemName', async (req,res,next) => {
    try {
        const item = await Menu.getMenuItem(req.params.restaurantId, req.params.itemName)
        return res.status(200).json({ item })
    }
    catch (err) {
        next(err)
    }
})

//Get average rating of a menu item
router.get('/rating/detail/average', async (req, res, next) => {
    try{
        const average = await Menu.getAverageRating(req.query.restaurant_id, req.query.item_name)
        return res.status(200).json({ average })

    }
    catch(err) {
        next(err)
    }
})

module.exports = router;