const Review = require('./review')
const { BadRequestError } = require('../utils/errors')


test('creates a review entry with missing req body', () => {
    expect(() => {Review.createReview()}).toBe(5000)
})
//test('creates a review entry with missing field', () => {
//    const payload = {
//        user_id: 1,
//	    restaurant_id: 1,
//	    menu_item_name:"cheetos"
//    }
//    expect(() => {Review.createReview(payload)}).toThrow()
//})
