const db = require('../db');
const { BadRequestError, UnauthorizedError, NotFoundError } = require('../utils/errors');
const axios = require('axios');
const Menu = require('./menu');

const OM_API_KEY = process.env.OPENMENU_API_KEY

class Restaurant {
    /* ----- Create ----- */

    // Given data and returnType, insert a restaurant into our db
    // returntype is either "menu" or "restaurant"
    // Return portions or all of the inserted data, depending on returntype

    static async getRestById(id) {
        const result = await db.query(`
        SELECT id, name, cuisine_type_primary
        FROM restaurants
        WHERE id = ${id}`)

        return result.rows[0]
    }
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

        const restaurant_info = data.restaurant_info
        const environment_info = data.environment_info
        const menuList = await Menu.insertMenu(data.menus, dbResponse.rows[0].id)

        // Return certain data based on given returnType
        return returntype === "restaurant" ? dbResponse.rows[0] : {restaurant_info, environment_info, menu: menuList}
    }
    
    /* ----- Retrieve ----- */

    // Searches API for restaurants matching a restaurantName within a region
    // Restaurant is presumably not in our db
    // Returns one restaurant, the first match
    static async apiSearchForRestaurantByName(restaurantName, city, postal_code) {
        // Intialize a variable for building our get request...
        // This variable serves to define HOW we'll be specifying the 'where' to look for a restaurant...
        // For example, we might define regionParam to be 'city' and pass a value of 'London' ;)
        let regionParam = ''

        // Throw an error if no city or postal_code was passed...
        if(city=='' && postal_code==0) {
            throw new BadRequestError('CITY OR POSTAL CODE MISSING')
        }

        // Determine how we'll be focusing our search...
        if(city!='') {
            regionParam = 'city'
        }
        if(postal_code!=0) {
            regionParam = 'postal_code'
        }

        // Determine the where we'll be focusing our search...
        let regionVal = (regionParam=='city')?city:postal_code // This variable actually store the WHERE to search for a restaurant...

        // Call the API...
        const result = await axios.get(`https://openmenu.com/api/v2/location.php?key=${OM_API_KEY}&country=us&${regionParam}=${regionVal}&s=${restaurantName}`)
            .catch((err) => {
                throw err
            })
        
        // Return an OpenMenu restaurant Id
        return result.data.response.result.restaurants[0].id
    }

    // Given an OpenMenu restaurant id...
    // Return details about a restaurant in the API
    static async apiRestaurantInfo(OMid) {
        // Call the API... 
        const result = await axios.get(`https://openmenu.com/api/v2/restaurant.php?key=${OM_API_KEY}&id=${OMid}`)
            .catch((err) => {
                throw err
            })

        // Return restaurant data
        return result.data.response.result
    }
    
    // Checks database for restaurant, if it can't find it, makes call to api
    static async getMenuByRestaurantName(restaurantName, city='', postal_code=0) {
        const result = await db.query(
            `SELECT menus.menu_verbose 
            FROM restaurants  
                LEFT JOIN menus 
                ON restaurants.id=menus.restaurant_id
            WHERE LOWER(restaurants.name) LIKE '%${restaurantName.replace(/[^a-zA-Z0-9 ]/g, '')}%'`
        )

        if(result.rows.length>0) {
            const menu = result.rows.map((menu_verbose) =>
                {
                    return menu_verbose.menu_verbose
                })
            return menu
        } else {
            const apiRestaurantId = await this.apiSearchForRestaurantByName(restaurantName, city, postal_code)
            if(!apiRestaurantId) { throw new BadRequestError("No restaurant id found") }
            const apiRestaurant = await this.apiRestaurantInfo(apiRestaurantId)
            const dbInsertResponse = await this.addRestaurantToDb(apiRestaurant, "menu")
            
            return dbInsertResponse
        }
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

    static async getMenuByOpenMenuId(OMId) {
        //Check if restaurant id is in database
        //if it is, return its menu
        //Else, make a call to the api and get the restaurant
        //Then return the menu
        const result = await db.query(
            `SELECT menus.menu_verbose 
            FROM restaurants  
                LEFT JOIN menus 
                ON restaurants.id=menus.restaurant_id
            WHERE restaurants.OpenMenu_id = $1`,
            [OMId]
        )
        if(result.rows.length>0) {
            const restaurant_verbose = await db.query(
                `SELECT restaurant_verbose
                FROM restaurants
                WHERE restaurants.OpenMenu_id = $1`,
                [OMId]
            )
            const restaurant_info = restaurant_verbose.rows[0].restaurant_verbose.restaurant_info
            const environment_info = restaurant_verbose.rows[0].restaurant_verbose.environment_info
            const menu = result.rows.map((menu_verbose) =>
                {
                    return menu_verbose.menu_verbose
                })
            return {restaurant_info, environment_info, menu}
        }
        else
        {
            const apiRestaurant = await this.apiRestaurantInfo(OMId)
            const dbInsertResponse = await this.addRestaurantToDb(apiRestaurant, "menu")
            
            return dbInsertResponse
        }
    }

    static async getRestaurantsByLocation(state, city, offset) {
        const results = await axios.get(`https://openmenu.com/api/v2/location.php?key=${OM_API_KEY}&country=us&state=${state}&city=${city}&offset=${offset}`)
        return {status: results.data.response.api.status, restaurants: results.data.response.result.restaurants}
    }

    static async getIdFromOpenMenuId (OMId) {
        const result = await db.query(`
        SELECT
            id
        FROM
            restaurants
        WHERE
            OpenMenu_id = $1
        `, [OMId])

        return result.rows[0]
    }
}

module.exports = Restaurant
