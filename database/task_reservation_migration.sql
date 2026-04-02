CREATE TABLE IF NOT EXISTS places (
    place_id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(trip_id),
    place_name TEXT NOT NULL,
    address TEXT,
    rating NUMERIC(2, 1),
    place_type TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
    task_id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(trip_id),
    title TEXT NOT NULL,
    due_date DATE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_user_id INTEGER REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS reservations (
    reservation_id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(trip_id),
    provider TEXT,
    place_name TEXT,
    reservation_type TEXT,
    reservation_date DATE,
    confirmation_no TEXT,
    place_id INTEGER REFERENCES places(place_id)
);

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS assigned_user_id INTEGER REFERENCES users(user_id);

ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS place_name TEXT;

ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS reservation_type TEXT;

ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS reservation_date DATE;

UPDATE tasks
SET completed = FALSE
WHERE completed IS NULL;

UPDATE tasks t
SET assigned_user_id = trip_members.user_id
FROM (
    SELECT m.trip_id, m.user_id,
           ROW_NUMBER() OVER (PARTITION BY m.trip_id ORDER BY m.joined_at, m.user_id) AS member_rank
    FROM memberships m
) AS trip_members
WHERE t.assigned_user_id IS NULL
  AND t.trip_id = trip_members.trip_id
  AND ((t.task_id - 1) % 3) + 1 = trip_members.member_rank;

UPDATE reservations
SET place_name = COALESCE(place_name, provider),
    reservation_type = COALESCE(reservation_type, 'Reservation')
WHERE place_name IS NULL OR reservation_type IS NULL;
