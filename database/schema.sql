-- Initial schema goes here.


CREATE TABLE users(
	user_id SERIAL PRIMARY KEY,
	
	email VARCHAR(100) UNIQUE NOT NULL,
	display_name VARCHAR(50) NOT NULL,
	password_hash VARCHAR(255) NOT NULL,
	
	is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE trips(
	trip_id SERIAL PRIMARY KEY,
	
	trip_name VARCHAR(50) NOT NULL	, 
	start_date DATE,
	end_date DATE,
	
	owner_user_id INTEGER NOT NULL,
	destination_text TEXT,
	destination_lat DOUBLE PRECISION,
	destination_lng DOUBLE PRECISION,
	
	
	FOREIGN KEY (owner_user_id) REFERENCES users(user_id),
	
	CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE TABLE roles(
	role_id SERIAL PRIMARY KEY,
	role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE memberships(
	user_id INTEGER,
	trip_id INTEGER,
	
	role_id INTEGER NOT NULL,
	joined_at DATE DEFAULT CURRENT_DATE,
	
	PRIMARY KEY(user_id, trip_id),
	
	FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
	FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE CASCADE,
	FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

CREATE TABLE tasks (
    task_id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    due_date DATE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_user_id INTEGER,

    FOREIGN KEY (trip_id) REFERENCES trips(trip_id),
    FOREIGN KEY (assigned_user_id) REFERENCES users(user_id)
);

CREATE TABLE places (
    place_id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL,
    place_name TEXT NOT NULL,
    address TEXT,
    rating NUMERIC(2, 1),
    place_type TEXT,

    FOREIGN KEY (trip_id) REFERENCES trips(trip_id)
);

CREATE TABLE reservations (
    reservation_id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL,
    provider TEXT,
    place_name TEXT,
    reservation_type TEXT,
    reservation_date DATE,
    confirmation_no TEXT,
    place_id INTEGER,

    FOREIGN KEY (trip_id) REFERENCES trips(trip_id),
    FOREIGN KEY (place_id) REFERENCES places(place_id)
);
