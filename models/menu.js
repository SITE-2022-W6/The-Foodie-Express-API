const db = require('../db');
const { NotFoundError } = require('../utils/errors');

class Menu {

    static async getMenu(restaurantId) {
        //Get menu from database
        console.log("in menus")
        const result = await db.query(`
        SELECT menu
        FROM menus
        WHERE restaurant_id = $1;       
        `,
            [restaurantId])

        console.log("result.rows.length: ", result.rows.length)
        return result.rows.length != 0 ? result.rows[0] : new NotFoundError
    }

    static async insertMenu(restaurantId, menu = []) {
        console.log("Inserting menu")
        const result = await db.query(`
        INSERT INTO menus
        (
            restaurant_id,
            menu 
        )
        VALUES ($1, $2::json[])
        RETURNING
            id,
            restaurant_id,
            menu,
            created_at
        `, [
            restaurantId,
            menu
        ])

        return result.rows[0]
    }
}

module.exports = Menu