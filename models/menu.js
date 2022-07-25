const db = require('../db')

const { NotFoundError } = require('../utils/errors')

class Menu {
    static async insertMenu(menus, restaurant_id) {
        menus.forEach(async (menu) => { 
            // Set menu values
            let name = menu.menu_name
            let descrption = menu.menu_description
            let menu_verbose = menu
            // Insert menu into db
            const dbResponse = await db.query(`
            INSERT INTO menus (restaurant_id, menu_name, menu_description, menu_verbose)
            VALUES ($1, $2, $3, $4)
            RETURNING *`, 
            [restaurant_id, name, descrption, menu_verbose])

            this.addItemsToDb(menu.menu_groups, dbResponse.rows[0].id)
         })
    }
    
    static async addItemsToDb(groups, menu_id) {
        groups.forEach((group) => {
            let group_name = group.group_name
            group.menu_items.forEach(async (item) => {
                let name = item.menu_item_name
                let description = item.menu_item_descrption
                let price = item.menu_item_price
                let calories = item.menu_item_calories
                let item_verbose = item

                const dbResponse = await db.query(`
                INSERT INTO items (menu_id, group_name, name, description, price, calories, item_verbose)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *`, 
                [menu_id, group_name, name, description, price, calories, item_verbose])
            })
        })
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