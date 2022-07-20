CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE CHECK (POSITION('@' IN email) > 1),
  phone_number TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE restaurants (
  id SERIAL PRIMARY KEY,
  OpenMenu_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  brief_description TEXT,
  phone TEXT NOT NULL,
  fax TEXT NOT NULL,
  address_1 TEXT NOT NULL,
  address_2 TEXT,
  cuisine_type_primary TEXT NOT NULL,
  operating_days TEXT NOT NULL,
  operating_days_printable TEXT NOT NULL,
  restaurant_verbose TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE menus (
  id SERIAL PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  menu JSON[] NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_DATE,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(OpenMenu_id) ON DELETE CASCADE
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  restaurant_id TEXT NOT NULL,
  menu_item_name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  content TEXT,
  --Optional image urls maybe
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_DATE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(OpenMenu_id) ON DELETE CASCADE
)