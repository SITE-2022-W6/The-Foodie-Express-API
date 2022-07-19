const express = require('express');
const router = express.Router();

const Review = require("../models/review")

router.post('/create-post', async (req, res, next) => {
    try {
        const review = await new Review.createPost(req.body)
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

module.exports = router