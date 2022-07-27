const db = require('../db')

const { NotFoundError } = require('../utils/errors')

class Menu {
    static async insertMenu(menus, restaurant_id) {
        //Returns nested array of Promises
        const Promises = await menus.map(async (menu) => { 
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

            const menuGroup = await this.addItemsToDb(menu.menu_groups, dbResponse.rows[0].id)
            return menuGroup
         })
         //Waits for promises to resolve. Nested Array of menu items
         const menuNestedArr = await Promise.all(Promises)

         //Rearranges menu items into 1 array
         let menuArr = []
         menuNestedArr.forEach((menu) => {
            menu.forEach((group) => {
                group.forEach((item) => {
                    menuArr.push(item)
                })
            })
         })
         return menuArr
    }
    
    static async addItemsToDb(groups, menu_id) {
        const returnGroup = await groups.map(async (group) => {

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
                RETURNING id, name, group_name, description, price, calories`, 
                [menu_id, group_name, name, description, price, calories, item_verbose])

                
                return dbResponse.rows[0]
            })
            return await Promise.all(groupMenuItems)
        })
        return Promise.all(returnGroup)
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