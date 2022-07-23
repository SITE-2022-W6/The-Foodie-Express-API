const db = require('../db');
const { BadRequestError, UnauthorizedError, NotFoundError } = require('../utils/errors');
const axios = require('axios');
const Menu = require('./menu');

const OM_API_KEY = process.env.OPENMENU_API_KEY

class Restaurant {
    static async getMenuByRestaurantName(restaurantName, city='', postal_code=0) {
        const result = await db.query(
            `SELECT * FROM menus 
                LEFT JOIN restaurants 
                ON restaurants.id = menus.restaurant_id
            WHERE restaurants.name = "${restaurantName}"`,
            [restaurantName]
        )
    
        if(!result.rows.length == 0) {
            return result.rows[0]
        } else {
            const apiCallResponse = apiCallForRestaurantByName(restaurantName, city, postal_code)
            const dbInsertResponse = addRestaurantToDb(apiCallResponse)
            return dbInsertResponse
        }
    }
    static async apiCallForRestaurantByName(restaurantName, city, postal_code) {
        const location = ''
        // Check for city or postal_code, throw an error if none was passed
        if(city=='' && postal_code==0) {
            throw new BadRequestError('CITY OR POSTAL CODE MISSING')
        }
        // Determine which parameter to use for api call
        if(city!='') {
            location = 'city'
        }
        if(postal_code!=0) {
            location = 'postal_code'
        }

        const result = await axios.get(`https://openmenu.com/api/v2/location.php?key=${OM_API_KEY}&country=us&${location}=${location=='city'?city:postal_code}&s=${restaurantName}`)
            .catch((err) => {
                console.log(err)
            })
        
        return result.data.response.result
    }
    static async addRestaurantToDb(data) {
        // Set restaurant values
        let OpenMenu_id = data.id
        let name = data.restaurant_info.restaurant_name
        let brief_description = data.restaurant_info.brief_description
        let phone = data.restaurant_info.phone
        let fax = data.restaurant_info.fax
        let address_1 = data.restaurant_info.address_1
        let address_2 = data.restaurant_info.address_2
        let cuisine_type_primary = data.environment_info.cuisine_type_primary
        let operating_days = JSON.stringify(data.operating_days)
        let operating_days_printable = data.JSON.stringify(data.operating_days_printable)
        let restaurant_verbose = data

        //Insert restaurant into db
        const dbResponse = await db.query(`
        INSERT INTO restaurants (
            OpenMenu_id,
            name,
            brief_description,
            phone, 
            fax,
            address_1, 
            address_2, 
            cuisine_type_primary, 
            operating_days,
            operating_days_printable,
            restaurant_verbose )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`, 
        [id, OpenMenu_id, name, brief_description, phone, fax, address_1, address_2, cuisine_type_primary, operating_days, operating_days_printable, restaurant_verbose])

        this.addMenusToDb(data.menus, dbResponse.rows[0].id)

        return dbResponse.rows[0]
    }
    static async addMenusToDb(menus, restaurant_id) {
        menus.forEach((menu) => { 
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
            group.menu_items.forEach((item) => {
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
    //Gets a restaurant by its OpenMenu id
    static async getRestaurantById(id) {
        //First check the database to see if it is stored
        const results = await db.query(`
        SELECT *
        FROM restaurants
        WHERE OpenMenu_id = $1
        `,
            [id])
        // console.log("results: ",results)
        //If restaurant is not in database
        console.log("results.rows.length", results.rows.length)
        if (results.rows.length == 0) {
            //Make a get request to OpenMenu API
            //Get restuarant details
            //Store it in restaurant database
            //Store menu into menu database
            //return restaurant details

            return axios.get(`https://openmenu.com/api/v2/restaurant.php?key=${OM_API_KEY}&id=${id}`)
                .then(async (response) => {
                    //console.log("response:", response.data.response.result)
                    //Shortening variable names
                    const data = response.data.response.result
                    //Miscellaneous data from restaurants
                    const verbose = {
                        restaurant_info: data.restaurant_info,
                        environment_info: data.environment_info,
                        logo_urls: data.logo_urls,
                        seating_locations: data.seating_locations,
                        accepted_currencies: data.accepted_currencies,
                        parking: data.parking,
                        settings: data.settings
                    }

                    //Inserting restaurant details into database
                    const OMresults = await db.query(`
                    INSERT INTO restaurants (
                        OpenMenu_id,
                        name,
                        brief_description,
                        phone,
                        fax,
                        address_1,
                        address_2,
                        cuisine_type_primary,
                        operating_days,
                        operating_days_printable,
                        restaurant_verbose
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    RETURNING 
                        id, 
                        OpenMenu_id, 
                        name, 
                        brief_description,
                        phone,
                        fax,
                        address_1,
                        address_2,
                        cuisine_type_primary,
                        operating_days,
                        operating_days_printable,
                        restaurant_verbose,
                        created_at
                    `,
                        [
                            data.id,
                            data.restaurant_info.restaurant_name,
                            data.restaurant_info.brief_description,
                            data.restaurant_info.phone,
                            data.restaurant_info.fax,
                            data.restaurant_info.address_1,
                            data.restaurant_info.address_2,
                            data.environment_info.cuisine_type_primary,
                            data.operating_days,
                            data.operating_days_printable,
                            verbose
                        ])


                    //Insert menu into database
                    let menujson = {}
                    data.menus.forEach((menu, index) => {
                        menujson[index] = menu
                    })
                    // console.log("menujson: ", menujson)
                    // console.log("data.menus", data.menus)
                    Menu.insertMenu(data.id, menujson)
                    // console.log("About to return")
                    // console.log("OMresults.rows[0]:", OMresults.rows[0])
                    return OMresults.rows[0]
                })
                .catch((err) => {
                    console.log(err)
                })
        }
        //restuarant is in database
        else {
            //return restaurant details
            // console.log( "Am I here?" )
            return results.rows[0]
        }
    }

    static async getMenuItemById() {

    }

    static async getMenuItemsByRestaurantId() {

    }
}

module.exports = Restaurant