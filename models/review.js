const db = require("../db")

const { BadRequestError } = require("../utils/errors")

class Review {
    static async createReview(content) {
        // Check for required fields, if a field is missing throw an error
        const requiredFields = ["user_id", "restaurant_id", "menu_item_name", "rating"]
        requiredFields.forEach(field => {
            if (!content.hasOwnProperty(field)) {
                throw new BadRequestError(`Missing ${field} in req body`)
            }
        })
        // Tracks fields for building db query
        let columns = {
            "user_id" : content.user_id,
            "restaurant_id" : content.restaurant_id,
            "menu_item_name" : content.menu_item_name,
            "rating" : content.rating
        }
        // Check for optional fields
        const optionalFields = ["content"]
        optionalFields.forEach(field => {
            if(content.hasOwnProperty(field)) {
                columns[field] = content[field]
            }
        })
        // Auxiliary array for building db query
        const valuesIndices = Object.keys(columns).map((e, ind) => (`$${ind+1}`))
        // Query the db and store results
        const result = await db.query(
            `INSERT INTO reviews (${ Object.keys(columns).toString() })
             VALUES (${ valuesIndices.toString() })
             RETURNING id, user_id, restaurant_id, menu_item_name, rating, content;`,
            Object.values(columns)
        )
        
        return result.rows[0]
    }

    static async getReviewById(id) {
        // Check if id exists, if not throw an error
        this.checkForId(id)

        // Query the db and store results
        const result = await db.query(
            `SELECT * FROM reviews WHERE id=${id}`
        )
        
        return result.rows[0]
    }

    static async getReviewsByUserId(userId) {
        const results = await db.query(
            `
            SELECT * FROM reviews WHERE user_id = $1
            `
            ,[userId]
        )

        return results.rows
    }

    static async updateReview(id, column, content) {
        this.checkForId(id)
        await db.query(`UPDATE reviews SET ${column}=${content.content} WHERE id='${id}'`)
    }

    static async deleteReview(id) {
        this.checkForId(id)
        await db.query(`DELETE FROM reviews WHERE reviews.id='${id}'`)
    }

    /* ---- Helpers ---- */
    static async checkForId(id) {
        if(!id) { throw new BadRequestError('No ID') }
    }
}

module.exports = Review