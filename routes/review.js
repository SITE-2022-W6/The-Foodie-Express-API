const express = require('express');
const router = express.Router();

const Review = require("../models/review");
const { route } = require('./restaurant');

router.post('/create-review', async (req, res, next) => {
    try {
        // console.log(req.body)
        const review = await Review.createReview(req.body)
        return res.status(201).json({ review })
    } catch(err) {
        next(err)
    }
})

router.get('/:id', async (req, res, next) => {
    try {
        const review = await Review.getReviewById(req.params.id)
        return res.status(200).json({ review })
    } catch (err) {
        next(err)
    }
})

router.put('/:id/:column', async (req, res, next) => {
    try {
        await Review.updateReview(req.params.id, req.params.column, req.body)
        return res.status(200).json({ "Update Status":"Successful"} )
    } catch(err) {
        next(err)
    }
})

router.delete('/:id', async (req, res, next) => {
    try {
        await Review.deleteReview(req.params.id)
        return res.status(200).json( {"Deletion Status":"Successful"} )
    } catch(err) {
        next(err)
    }
})

router.get('/all/:id', async (req, res, next) => {
    try {
        const all = await Review.getReviews(req.params.id)
        return res.status(200).json({ all })
    } catch(e) {
        next(e)
    }
})

router.get('/all/review/item', async (req, res, next) => {
    try{
        const reviews = await Review.getReviewsForItem(req.query.restaurant_id, req.query.item_name)
        return res.status(200).json({ reviews })
    } catch (err)
    {
        next(err)
    }
})

module.exports = router