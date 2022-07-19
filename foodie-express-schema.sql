CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE CHECK (POSITION('@' IN email) > 1),
  phone_number TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE menus (
  id SERIAL PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  menu JSON NOT NULL,
  FOREIGN KEY (restaurant_id) REFERENCES restaurant(OpenMenu_id) ON DELETE CASCADE
);