--Verify CRUD operations, Relationships, and Constraints

--CRUD tests
--Create
INSERT INTO trips(trip_name, owner_user_id)
VALUES('Test Trip', 1);

--Read
SELECT * FROM trips;

--Update
UPDATE trips
SET trip_name = 'Updated Trip'
WHERE trip_name = 'Test Trip';

--Delete
DELETE FROM trips 
WHERE trip_name = 'Updated Trip';

--get Users in a trip
SELECT u.display_name as Name, r.role_name as Role
FROM memberships m
JOIN users u ON m.user_id = u.user_id
JOIN roles r ON m.role_id = r.role_id
WHERE m.trip_id = 1;

--Verify constraints
--test if user doesn't exist for memberships table
INSERT INTO memberships(user_id, trip_id, role_id)
VALUES(999, 1, 1);

--test if trip doesnt exist for memberships table
INSERT INTO memberships(user_id, trip_id, role_id)
VALUES(1, 67, 1);

--test if role doesnt exist for memberships table
INSERT INTO memberships(user_id, trip_id, role_id)
VALUES(1, 1, 69);

--test if owner doesn't exist for trips table
INSERT INTO trips(trip_name, start_date, end_date, owner_user_id)
VALUES ('Invalid Owner Trip', '2026-04-24', '2026-05-07', 999);

--test if trip dates are invalid:
INSERT INTO trips(trip_name, start_date, end_date, owner_user_id)
VALUES ('Valhalla', '2026-05-24', '2026-04-07', (SELECT user_id FROM users WHERE email = 'larplarplarpsahur@gmail.com'));  


-- ============================================================
-- TASKS CRUD + useful queries
-- ============================================================

-- Create
INSERT INTO tasks (trip_id, title, due_date)
VALUES (
    (SELECT trip_id FROM trips WHERE trip_name = 'Valhalla'),
    'Book airport transfer',
    '2026-04-20'
);

-- Read all tasks for a trip
SELECT *
FROM tasks
WHERE trip_id = (SELECT trip_id FROM trips WHERE trip_name = 'Valhalla')
ORDER BY due_date NULLS LAST, task_id;

-- Read one task
SELECT *
FROM tasks
WHERE task_id = (
    SELECT task_id
    FROM tasks
    WHERE title = 'Book airport transfer'
    ORDER BY task_id DESC
    LIMIT 1
);

-- Update
UPDATE tasks
SET title = 'Book airport shuttle',
    due_date = '2026-04-22'
WHERE task_id = (
    SELECT task_id
    FROM tasks
    WHERE title = 'Book airport transfer'
    ORDER BY task_id DESC
    LIMIT 1
);

-- Useful: overdue tasks
SELECT *
FROM tasks
WHERE due_date IS NOT NULL
  AND due_date < CURRENT_DATE
ORDER BY due_date, task_id;

-- Useful: task count by trip
SELECT t.trip_id, tr.trip_name, COUNT(*) AS task_count
FROM tasks t
JOIN trips tr ON tr.trip_id = t.trip_id
GROUP BY t.trip_id, tr.trip_name
ORDER BY task_count DESC, t.trip_id;

-- Delete
DELETE FROM tasks
WHERE task_id = (
    SELECT task_id
    FROM tasks
    WHERE title = 'Book airport shuttle'
    ORDER BY task_id DESC
    LIMIT 1
);

-- Verify task foreign key constraint
INSERT INTO tasks (trip_id, title, due_date)
VALUES (999, 'Invalid task trip', '2026-04-25');

-- Verify task NOT NULL constraint
INSERT INTO tasks (trip_id, title)
VALUES ((SELECT trip_id FROM trips WHERE trip_name = 'Valhalla'), NULL);


-- ============================================================
-- RESERVATIONS CRUD + useful queries
-- ============================================================

-- Create
INSERT INTO reservations (trip_id, provider, confirmation_no, place_id)
VALUES (
    (SELECT trip_id FROM trips WHERE trip_name = 'Valhalla'),
    'Delta Airlines',
    'DL-TA-2026',
    NULL
);

-- Read all reservations for a trip
SELECT *
FROM reservations
WHERE trip_id = (SELECT trip_id FROM trips WHERE trip_name = 'Valhalla')
ORDER BY provider NULLS LAST, reservation_id;

-- Read one reservation
SELECT *
FROM reservations
WHERE reservation_id = (
    SELECT reservation_id
    FROM reservations
    WHERE confirmation_no = 'DL-TA-2026'
    ORDER BY reservation_id DESC
    LIMIT 1
);

-- Update
UPDATE reservations
SET provider = 'United Airlines',
    confirmation_no = 'UA-TA-2026'
WHERE reservation_id = (
    SELECT reservation_id
    FROM reservations
    WHERE confirmation_no = 'DL-TA-2026'
    ORDER BY reservation_id DESC
    LIMIT 1
);

-- Useful: lookup by confirmation number
SELECT *
FROM reservations
WHERE confirmation_no = 'UA-TA-2026';

-- Useful: reservation count by trip
SELECT r.trip_id, tr.trip_name, COUNT(*) AS reservation_count
FROM reservations r
JOIN trips tr ON tr.trip_id = r.trip_id
GROUP BY r.trip_id, tr.trip_name
ORDER BY reservation_count DESC, r.trip_id;

-- Useful: reservations missing place_id
SELECT *
FROM reservations
WHERE place_id IS NULL
ORDER BY reservation_id;

-- Delete
DELETE FROM reservations
WHERE reservation_id = (
    SELECT reservation_id
    FROM reservations
    WHERE confirmation_no = 'UA-TA-2026'
    ORDER BY reservation_id DESC
    LIMIT 1
);

-- Verify reservation trip foreign key constraint
INSERT INTO reservations (trip_id, provider, confirmation_no, place_id)
VALUES (999, 'Invalid Provider', 'BAD-TRIP-001', NULL);

-- Verify reservation place foreign key constraint
INSERT INTO reservations (trip_id, provider, confirmation_no, place_id)
VALUES (
    (SELECT trip_id FROM trips WHERE trip_name = 'Valhalla'),
    'Invalid Place Provider',
    'BAD-PLACE-001',
    999
);
