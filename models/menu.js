const db = require('../db');
const { BadRequestError, UnauthorizedError } = require('../utils/errors');

class Menu {

    static async getMenu(restaurantId) {
        //Get menu from database
        const result = db.query( `
        SELECT menu
        FROM menus
        WHERE restaurant_id = $1;       
        `, 
        [restaurantId])

        return result.rows[0]
    }
}

module.exports = Menu