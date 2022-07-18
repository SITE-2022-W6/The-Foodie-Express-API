const express = require('express');
const Menu = require('../models/menu');
const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        //Pass in the restaurant id to that you want the menu for
        //menu will hold the menu for that restaurant
        const menu = await Menu.getMenu(req.body)
        return res.status(200).json({ menu })
    }
    catch (err) {
        next(err)
    }
})



module.exports = router;