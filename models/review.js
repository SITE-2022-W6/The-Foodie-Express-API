const db = require("../db")

const { BadRequestError } = require("../utils/errors")
const Preference = require("./preference")

class Review {
    /* ----- Create Review ----- */

    // Create a review, given an object with specific keys and values.
    static async createReview(content) {
        // Set fields our table, reviews, both requires and accepts...
        const requiredFields = ["user_id", "restaurant_id", "rest_id", "menu_item_name", "rating"]
        const optionalFields = ["content"]

        // Arrays for building our db query...
        let columns = []
        let values = []
        let valueIndices = []
        // Create a method for updating entryFields...
        let addField = (col, val) => {
            columns.push(col)
            values.push(val)
            valueIndices.push(`$${valueIndices.length+1}`)
        }

        // Populate our query-building ararys...
        requiredFields.forEach(field => {
            if (!content.hasOwnProperty(field)) {
                throw new BadRequestError(`Missing ${field} in req body`)
            } else {
                addField(field, content[field])
            }
        })
        optionalFields.forEach(field => {
            if(content.hasOwnProperty(field)) {
                addField(field, content[field])
            }
        })

        // Build and execute a query to  our db...
        const result = await db.query(
            `INSERT INTO reviews (${ columns.toString() })
             VALUES (${ valueIndices.toString() })
             RETURNING *`,
            values
        )
        // console.log(parseInt(result.rows[0].rest_id))
        const restPrimCuis = await db.query(
            `SELECT id, name, cuisine_type_primary
            FROM restaurants 
            WHERE id=$1`, 
            [parseInt(result.rows[0].rest_id)]
        )
        // console.log("primCuis", restPrimCuis.rows[0].cuisine_type_primary)
        let pref = await Preference.setPreference(result.rows[0].user_id, restPrimCuis.rows[0].cuisine_type_primary, result.rows[0].rating, 1)


        // console.log(pref)


        // Return our db entry...
        return result.rows[0]
    }
    /* ----- Update ----- */

    static async updateReview(id, column, content) {
        this.checkForId(id)
        
        const result = await db.query(`
            UPDATE reviews SET $1=$2 
            WHERE id=$3
            RETURNING *`, 
            [column, content.content, id]
        )

        return result.rows
    }

    /* ----- Retrieve ----- */
    
    // Given a review Id, return a review
    static async getReviewById(id) {
        this.checkForId(id)

        const result = await db.query(`
            SELECT * FROM reviews 
            WHERE id=$1`, 
            [id]
        )
        
        return result.rows[0]
    }

    // Return any reviews associated with a given item name and restaurantId
    static async getReviewsForItem(restaurantId, itemName)
    {
        const results = await db.query(`
            SELECT 
                reviews.content,
                reviews.created_at,
                reviews.rating,
                users.first_name,
                users.last_name
            FROM 
                reviews
            LEFT JOIN users ON reviews.user_id = users.id
            WHERE reviews.restaurant_id = $1 AND reviews.menu_item_name = $2 
            ORDER BY reviews.created_at DESC`, 
            [restaurantId, itemName])

        return results.rows
    }

    // Return a user's reviews
    static async getReviews(userId) {
        // console.log(userId)
        const result = await db.query(`
            SELECT * FROM reviews
            WHERE user_id=$1 
            ORDER BY created_at DESC`, 
            [userId]
        )
        // console.log(result.rows)
        return result.rows
    }

    /* ----- Delete ----- */

    // Given a review id, delete an id
    static async deleteReview(id) {
        this.checkForId(id)

        //Update preferences
        const review = await db.query(`SELECT * FROM reviews WHERE id=$1`, [id])
        const rest_id = review.rows[0].rest_id

        const restPrimCuis = await db.query(
            `SELECT id, name, cuisine_type_primary
            FROM restaurants 
            WHERE id=$1`, 
            [parseInt(rest_id)]
        )

        let pref = await Preference.setPreference(review.rows[0].user_id, restPrimCuis.rows[0].cuisine_type_primary, 0-review.rows[0].rating, -1)


        await db.query(`DELETE FROM reviews WHERE reviews.id=$1`, [id])
    }

    /* ---- Helper ---- */
    
    // If no id is passed, throw an error...
    static async checkForId(id) {
        if(!id) { throw new BadRequestError('No ID') }
    }
}

module.exports = Review