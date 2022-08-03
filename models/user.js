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

  static async fetchUserByEmail(email) {
    if (!email) {
      throw new BadRequestError('No email provided');
    }
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email.toLowerCase()]);
    const user = result.rows[0];
    return user;
  }

  static async fetchUserByUserId(userId) {
    if(!userId) {
      throw new BadRequestError('No Id provided')
    }
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await db.query(query, [userId]);
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

}
module.exports = User;
