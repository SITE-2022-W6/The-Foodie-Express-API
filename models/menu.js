const db = require('../db');
const { BadRequestError, UnauthorizedError } = require('../utils/errors');

class Menu {

    static async getMenu(restaurantId) {
        //Get menu from database
        const result = db.query( `
        SELECT 
        `)

    }
}

module.exports = Menu