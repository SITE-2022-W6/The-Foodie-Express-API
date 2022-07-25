const express = require('express');
const router = express.Router();

const Restaurant = require("../models/restaurant")

//Sanity check
router.get('/', async (req, res) => {
    res.status(200).json({ ping: 'restaurant' });
  });

// Find restaurant info provided an ID
router.get('/:id', async (req, res, next) => {
    try {

        // console.log("Getting restaurant by id")
        const restaurant = await Restaurant.getRestaurantById(req.params.id)
        return res.status(200).json({restaurant})
    }catch (err) {
        next(err)
    }
})


//Get list of restaurants by city and state
router.get('/location/:state/:city', async (req,res,next) => {
    try {
        const restaurants = await Restaurant.getRestaurantsByLocation(req.params.state, req.params.city)
        return res.status(200).json({restaurants})
    }catch (err) {
            next(err)
    }
})

//Search for restaurant menu
router.get('/search', async (req, res, next) => {
    try {
        const menu = await Restaurant.getMenuByRestaurantName(req.params.restaurant_name, req.query.city, req.query.postal_code)
        return res.status(200).json({menu})
    } catch(err) {

        next(err)
    }
})

module.exports = router;
