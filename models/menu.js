const db = require('../db')
const { NotFoundError } = require('../utils/errors')

class Menu {
    //Adds menu to db
    static async insertMenu(menus, restaurant_id) {
        //Returns nested array of Promises
        const menu = await menus.map(async (menu) => { 
            // Set menu values
            let name = menu.menu_name
            let description = menu.menu_description
            let menu_verbose = menu
            // Insert menu into db
            const dbResponse = await db.query(`
            INSERT INTO menus (restaurant_id, menu_name, menu_description, menu_verbose)
            VALUES ($1, $2, $3, $4)
            RETURNING *`, 
            [restaurant_id, name, description, menu_verbose])

            // console.log("menu_verbose: ", menu_verbose)

            let menuObj = {}
            menuObj.menu_name = name
            menuObj.menu_description = description
            menuObj.menu_groups = await this.addItemsToDb(menu.menu_groups, dbResponse.rows[0].id)
            return menuObj
         })
         //Waits for promises to resolve.
         const menuArr = await Promise.all(menu)
         return menuArr
    }
    
    //Adds menu item to db
    static async addItemsToDb(groups, menu_id) {
        const menuGroups = await groups.map(async (group) => {

            let group_name = group.group_name
            const groupMenuItems = await group.menu_items.map(async (item) => {
                let name = item.menu_item_name
                let description = item.menu_item_description
                let price = item.menu_item_price
                let calories = item.menu_item_calories
                let item_verbose = item

                const dbResponse = await db.query(`
                INSERT INTO items (menu_id, group_name, name, description, price, calories, item_verbose)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, name, description, price, calories`, 
                [menu_id, group_name, name, description, price, calories, item_verbose])

                
                return dbResponse.rows[0]
            })
            let groupObj = {}
            groupObj.group_name = group_name
            groupObj.group_description = group.group_description
            groupObj.menu_items = await Promise.all(groupMenuItems)
            return groupObj
        })
        return Promise.all(menuGroups)
    }
    
    //Get details about a menu item
    static async getMenuItem(restaurantId, itemName) {
        const result = await db.query(`
        SELECT 
            items.group_name,
            items.name,
            items.description,
            items.price,
            items.calories
        FROM
            restaurants
            JOIN menus ON restaurants.id=menus.restaurant_id
            JOIN items ON menus.id=items.menu_id
        WHERE restaurants.OpenMenu_id = $1
              AND items.name = $2 `, [restaurantId, itemName])
        return result.rows[0]
    }

    //Get average rating of a menu item
    static async getAverageRating(restuarantId, itemName)
    {
        const result = await db.query(`
        SELECT
            ROUND(AVG(rating), 2)
        FROM
            reviews
        WHERE 
            restaurant_id = $1
            AND menu_item_name = $2
        `, [restuarantId, itemName])

        return result.rows[0]
    }
}

module.exports = Menu