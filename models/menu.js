const db = require('../db')

const { NotFoundError } = require('../utils/errors')

class Menu {
    static async insertMenu(restaurantId, menu) {
        // console.log("Inserting menu")
        const result = await db.query(`
        INSERT INTO menus
        (
            restaurant_id,
            menu 
        )
        VALUES ($1, $2)
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
    static async createMenuItem() {
        
    }

    static async getMenuBy(restaurantId) {
        //Get menu from database
        const result = await db.query(`
        SELECT menu
        FROM menus
        WHERE restaurant_id = $1;       
        `,
            [restaurantId])

        console.log("result.rows.length: ", result.rows.length)
        return result.rows[0]
    }
}

module.exports = Menu