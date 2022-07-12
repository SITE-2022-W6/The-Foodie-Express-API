\echo 'Delete and recreate the_foodie_express db?'
\prompt 'Return for yes or control-c to cancel > ' answer

DROP DATABASE the_foodie_express;
CREATE DATABASE the_foodie_express;
\connect the_foodie_express;

\i the-foodie-express-schema.sql