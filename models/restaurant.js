const db = require('../db');
const { BadRequestError, UnauthorizedError, NotFoundError } = require('../utils/errors');
const axios = require('axios');
const Menu = require('./menu');

const OM_API_KEY = process.env.OPENMENU_API_KEY

class Restaurant {
    //Checks database for restaurant, if it can't find it, makes call to api
    static async getMenuByRestaurantName(restaurantName, city='', postal_code=0) {

        //console.log("getMenuByRestaurantName: ", restaurantName, city, postal_code)

        const result = await db.query(
            `SELECT restaurants.id,restaurants.name,menus.id,items.group_name,items.id,items.name, items.description, items.price, items.calories 
            FROM restaurants  
                LEFT JOIN menus 
                ON restaurants.id=menus.restaurant_id
                LEFT JOIN items 
                ON menus.id=items.menu_id
            WHERE LOWER(restaurants.name) LIKE '%${restaurantName.replace(/[^a-zA-Z0-9 ]/g, '')}%'`
        )
        //console.log("db results: ", result.rows)
        if(result.rows.length>0) {
            return result.rows
        } else {
            //console.log("db has no such entry, resorting to api calls: ")
            const apiRestaurantId = await this.apiSearchForRestaurantByName(restaurantName, city, postal_code)
            if(!apiRestaurantId) { throw new BadRequestError("No restaurant id found") }
            const apiRestaurant = await this.apiRestaurantInfo(apiRestaurantId)
            const dbInsertResponse = await this.addRestaurantToDb(apiRestaurant, "menu")
            
            return dbInsertResponse
        }
    }

    //Calls OpenMenu API to find restaurant and returns restaurant id
    static async apiSearchForRestaurantByName(restaurantName, city, postal_code) {
        //console.log("apiSearchForRest: ", restaurantName, city, postal_code)
        let location = ''
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
        let loc = (location=='city')?city:postal_code
        //console.log("location:", location, city, postal_code, loc, restaurantName, OM_API_KEY)
        const result = await axios.get(`https://openmenu.com/api/v2/location.php?key=${OM_API_KEY}&country=us&${location}=${loc}&s=${restaurantName}`)
            .catch((err) => {
                console.log(err)
            })
        //console.log(result.data.response.result.restaurants[0].id)
        return result.data.response.result.restaurants[0].id
    }

    //Calls the API and returns details about a restaurant
    static async apiRestaurantInfo(id) {
        //console.log("in apiRestaurantInfo: id:", id)
        const result = await axios.get(`https://openmenu.com/api/v2/restaurant.php?key=${OM_API_KEY}&id=${id}`)
            .catch((err) => {
                console.log(err)
            })
        //console.log("Restaurant info:", result.data.response.result)
        return result.data.response.result
    }

    //Return type is either the menu or restaurant details
    static async addRestaurantToDb(data, returntype) {
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
        let operating_days_printable = JSON.stringify(data.operating_days_printable)
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
        [OpenMenu_id, name, brief_description, phone, fax, address_1, address_2, cuisine_type_primary, operating_days, operating_days_printable, restaurant_verbose])
        
        const menuList = await Menu.insertMenu(data.menus, dbResponse.rows[0].id)
        //this.addMenusToDb(data.menus, dbResponse.rows[0].id)
        //console.log("end of addRestauranttoDB ------- ")
        return returntype === "restaurant" ? dbResponse.rows[0] : menuList
    }

    static async getMenusByRestaurantId(id) {
        const result = await db.query(
            `SELECT * FROM menus 
                LEFT JOIN items 
                ON menus.id=items.menu_id
            WHERE menus.restaurant_id='${id}'`
        )

        return result.rows
    }

    static async getMenuItemById() {

    }

    static async getRestaurantsByLocation(state, city) {
        const results = await axios.get(`https://openmenu.com/api/v2/location.php?key=${OM_API_KEY}&country=us&state=${state}&city=${city}`)
        return results.data.response.result.restaurants
    }
}

module.exports = Restaurant
