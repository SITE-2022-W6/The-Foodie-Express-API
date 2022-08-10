const db = require("../db")

class Preference {
    /* ----- Create ----- */

    // Given: userId, cuisine, and rating
    // Insert a NEW entry in table preferences.
    static async createPreference(userId, cuisine, rating) {
        // Try inserting a new entry in db...
        try {
            const result = await db.query(`
                INSERT INTO preferences (user_id, cuisine, rating)
                VALUES ($1, $2, $3) 
                RETURNING *`, 
                [userId, cuisine, rating]
            )
            // Return the new entry...
            return result.rows
        } catch(e) { 
            // If an error occurs, return an error message...
            return { "error in creatingPreference function: " :  e }
        }
    } 

    /* ----- Update ----- */

    // Given: userId, cuisine, and rating
    // Update an entry in table preferences.
    static async updatePreference(userId, cuisine, rating) {
        // Try updating an entry in db...
        try {
            const result = await db.query(`
                UPDATE preferences 
                SET rating=rating+$1, quantity=quantity+1 
                WHERE user_id=$2 AND cuisine=$3 
                RETURNING *`, 
                [rating, userId, cuisine]
            )
            // Return the updated entry...
            return result.rows
        } catch(e) {
            // If an error occurs, return an error message...
            return { "error in updatingPreference function: " :  e }
        }
    }

    /* ----- Retrieve ----- */

    // Given: userId
    // Return all entries with matching user_id values
    static async retrievePreferences(userId) {
        const result = await db.query(`
            SELECT * FROM preferences 
            WHERE user_id=$1`, 
            [userId]
        )

        return result.rows
    }

    /* ----- Delete ----- */

    // Given: id
    // Delete a preference.
    static async deletePreference(id) {
        await db.query(`
            DELETE FROM preferences
            WHERE id=$1`,
            [id]
        )
    }


    /* ----- Callers ----- */

    // Given: userId, cuisine, rating
    // Either create a new user preference or update an existing one
    static async setPreference(userId, cuisine, rating) {
        let pref = {}

        const result = await db.query(`
            SELECT * FROM preferences
            WHERE user_id=$1 AND cuisine=$2`,
            [userId, cuisine]
        )

        // Creates a new entry or updates an existing one
        // Calls the appropriate function...
        if(result.rows.length>0) {
            pref = this.updatePreference(userId, cuisine, rating)
        } else {
            pref = this.createPreference(userId, cuisine, rating)
        }

        return pref
    }

    static async favoriteCuisine(userId) {
        let preferences = await this.retrievePreferences(userId)
        console.log(userId)
        console.log(preferences)
        let favoriteCuisine = {}

        let updateFavoriteCuisine = (cuisine, rating, quantity) => {
            favoriteCuisine['cuisine'] = cuisine
            favoriteCuisine['rating'] = rating / quantity
        }

        preferences.forEach((preference) => {
            // If favoriteCuisine.rating is not defined, populate favoriteCuisine with preference's values
            // Otherwise, update favoriteCuisine if preference has a higher average rating for it's associated cuisine
            if(!favoriteCuisine?.rating || favoriteCuisine.rating < (preference.rating / preference.quantity)) {
                updateFavoriteCuisine(preference.cuisine, preference.rating, preference.quantity)
            }
        })

        return favoriteCuisine
    }
}

module.exports = Preference