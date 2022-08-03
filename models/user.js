const db = require('../db');
const bcrypt = require('bcrypt');
const { BadRequestError, UnauthorizedError } = require('../utils/errors');
const { BCRYPT_WORK_FACTOR } = require('../config');

class User {
  static async login(credentials) {
    const requiredFields = ['email', 'password'];
    requiredFields.forEach((field) => {
      if (!credentials.hasOwnProperty(field)) {
        throw new BadRequestError(`Missing ${field} in request body.`);
      }
    });

    const user = await User.fetchUserByEmail(credentials.email);

    if (user) {
      const isValid = await bcrypt.compare(credentials.password, user.password);
      if (isValid) {
        return user;
      }
    }

    throw new UnauthorizedError('Invalid email/password');
  }

  static async register(credentials) {
    const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'phoneNumber',
      'password',
    ];
    requiredFields.forEach((field) => {
      if (!credentials.hasOwnProperty(field)) {
        throw new BadRequestError(`Missing ${field} in request body.`);
      }
    });

    const existingUser = await User.fetchUserByEmail(credentials.email);
    if (existingUser) {
      throw new BadRequestError(`This email address already in use`);
    }

    const lowerCaseEmail = credentials.email.toLowerCase();
    const hashedPassword = await bcrypt.hash(
      credentials.password,
      BCRYPT_WORK_FACTOR
    );

    const result = await db.query(
      `
    INSERT INTO users (
      first_name,
      last_name,
      email,
      phone_number,
      password
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
      [ 
        credentials.firstName, 
        credentials.lastName, 
        lowerCaseEmail, 
        credentials.phoneNumber, 
        hashedPassword, 
      ] 
    );
    const user = result.rows[0];
    return user;
  }

  static async update(id, column, body) {
    await db.query(`UPDATE users SET $1=$2 WHERE id=$3`, [column, body[column], id])
  }

  static async fetchUserByEmail(email) {
    if (!email) {
      throw new BadRequestError('No email provided');
    }
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email.toLowerCase()]);
    const user = result.rows[0];
    return user;
  }

  /**CRAZY experimental SQL query attempt
   * Commented out because it's too complicated.
   * 
   * Better ways of setting prefernces exist.
  */
  // Given a user, returns cuisines with their respective number of entries and summed ratings.
  /*static async reviewedCuisineData(userId) {
    const result = await db.query(`
      SELECT restaurants.cuisine_type_primary AS cuisine, 
        COUNT(reviews.menu_item_name) AS quantity, 
        SUM(reviews.rating) AS rating_total
      FROM reviews 
        LEFT JOIN restaurants 
        ON reviews.restaurant_id=restaurants.id
      WHERE reviews.id='${userId}'
      GROUP BY restaurants.cuisine_type_primary`)

    return result.rows
  }*/
// Add a new category to preferences
  static async newUserPreference(userId, cuisine, rating) {
    const result = await db.query(`
      INSERT INTO preferences (user_id, cuisine, rating)
      VALUES ($1, $2, $3) 
      RETURNING *`, [userId, cuisine, rating])
    
    return result.rows
 } 
// If cuisine already in table, just update it
 static async updateUserPreference(userId, cuisine, rating) {
  const result = await db.query(`
    UPDATE preferences 
    SET rating=rating+$1, quantity=quantity+1 
    WHERE user_id=$2 AND cuisine=$3 
    RETURNING *`, [rating, userId, cuisine])

  return result.rows
 }

 // Returns a users categories in average-rating order, ascending.
 // Called on after a user logs in and goes to their dashboard.
 static async recommend(userId) {
  const result = await db.query(`SELECT * FROM preferences WHERE user_id=$1`, [userId])
  let highestRatedCuisine = {};
  let avgRatings = result.rows.map((row) => {
    if(!highestRatedCuisine?.rating)
     {highestRatedCuisine['cuisine']=row.cuisine;highestRatedCuisine['rating']=row.rating / row.quantity}
    else if
     (highestRatedCuisine.rating <row.rating / row.quantity) {highestRatedCuisine['cuisine']=row.cuisine; highestRatedCuisine['rating']=row.rating / row.quantity}
    return {[row.cuisine]: row.rating / row.quantity}
  })
  // The sort function is used to sort alphabetic characters, but it will apply the function
  // and now sort ints.
  // Commented out because it works for arrays, not objs.
  // Should time allow, I'll reimplement.
  //avgRatings.sort(
  //  function(a, b){
  //    return a - b
  //})

  

  return {...avgRatings, highestRatedCuisine}
 }


// Update/add preferences for a user.
// Called on after a review is submitted.
// Mostly just a QoL function for dealing with updating vs creating an entry in table preferences.
  static async addPreference(userId, cuisine, rating) {
    const result = await db.query(`
      SELECT * FROM preferences
      WHERE user_id=${userId} AND cuisine='${cuisine}'`)
    if(result.rows.length>0) {
      this.updateUserPreference(userId, cuisine, rating)
    } else {
      this.newUserPreference(userId, cuisine, rating)
    }
  }

  static async getRecommendations(cuisine) {
    // Call the api with a cuisine as the search param
    // Return list of restaurants 
    // Quite frankly this portion might not be part of my job
    // Seems not like a backend thing to do
  }

  
}
module.exports = User;
