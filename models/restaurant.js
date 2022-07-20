const db = require('../db');
const { BadRequestError, UnauthorizedError, NotFoundError } = require('../utils/errors');
const axios = require('axios');
const Menu = require('./menu');

const OM_API_KEY = process.env.OPENMENU_API_KEY

class Restaurant {
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
        if (results.rows.length == 0) {
            //Make a get request to OpenMenu API
            //Get restuarant details
            //Store it in restaurant database
            //Store menu into menu database
            //return restaurant details

            axios.get(`https://openmenu.com/api/v2/restaurant.php?key=${OM_API_KEY}&id=${id}`)
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

                    console.log("OMresults.rows[0]:", OMresults.rows[0])

                    console.log("data.menus", data.menus)
                    Menu.insertMenu(data.id, data.menus)

                    return OMresults.rows[0]
                })
                .catch((err) => {
                    console.log(err)
                })
        }
        //restuarant is in database
        else {
            //return restaurant details
            return results.rows[0]
        }
    }

    // static async getRestaurantByOpenMenuId(OpenMenuId) {

    // }
}

module.exports = Restaurant