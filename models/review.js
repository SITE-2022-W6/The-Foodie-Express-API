class Review {
    static async createReview(content) {
        const requiredFields = ["user_id", "restaurant_id", "menu_item_name", "rating"];
        requiredFields.forEach(field => {
            if (!data.hasOwnProperty(field)){
                throw new BadRequestError(`Missing ${field} in req body`)
            }
        })


        const result = await db.query(
            `INSERT INTO reviews (user_id, restaurant_id, menu_item_name, rating)
             VALUES ($1, $2, $3, $4)
             RETURNING id, user_id, restaurant_id, menu_item_name, rating, content;`,
            [content.id, content.user_id, content.menu_item_name, content.rating]
        )


        return result.rows[0]
    }

    static async getReviewById() {

    }
}

module.exports = Review