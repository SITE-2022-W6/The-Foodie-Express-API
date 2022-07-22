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
        if(city=='' && postal_code==0) {
            throw new BadRequestError('CITY OR POSTAL CODE MISSING')
        }
        if(city!='') {
            location = 'city'
        }
        if(postal_code!=0) {
            location = 'postal_code'
        }

        return axios.get(`https://openmenu.com/api/v2/location.php?key=${OM_API_KEY}&country=us&${location}=${location=='city'?city:postal_code}&s=${restaurantName}`)
                    .catch((err) => {
                        console.log(err)
                    })
    }
    static async addRestaurantToDb(apiCallResponse) {

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

    static async getMenuItemByRestaurantId() {

    }
    // Returns an array of menu items given OpenMenu API response data
    static async getMenuItems(data) {
        const data = response.data.response.result

    }
}

module.exports = Restaurant