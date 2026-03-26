-- GroupGo task and reservation queries
-- Use this file as the working query reference for the tasks and reservations tables.

-- ============================================================
-- TASKS
-- ============================================================

-- Create a task for a trip
INSERT INTO tasks (trip_id, title, due_date)
VALUES (:trip_id, :title, :due_date)
RETURNING task_id, trip_id, title, due_date;

-- Read one task by id
SELECT task_id, trip_id, title, due_date
FROM tasks
WHERE task_id = :task_id;

-- Read all tasks for a trip ordered by due date
SELECT task_id, trip_id, title, due_date
FROM tasks
WHERE trip_id = :trip_id
ORDER BY due_date NULLS LAST, task_id;

-- Update a task's title and due date
UPDATE tasks
SET title = :title,
    due_date = :due_date
WHERE task_id = :task_id
RETURNING task_id, trip_id, title, due_date;

-- Move a task to a different trip
UPDATE tasks
SET trip_id = :trip_id
WHERE task_id = :task_id
RETURNING task_id, trip_id, title, due_date;

-- Delete a task
DELETE FROM tasks
WHERE task_id = :task_id
RETURNING task_id, trip_id, title, due_date;

-- Useful task queries

-- Overdue tasks
SELECT task_id, trip_id, title, due_date
FROM tasks
WHERE due_date IS NOT NULL
  AND due_date < CURRENT_DATE
ORDER BY due_date, task_id;

-- Tasks due in the next 7 days
SELECT task_id, trip_id, title, due_date
FROM tasks
WHERE due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
ORDER BY due_date, task_id;

-- Task count per trip
SELECT t.trip_id,
       tr.trip_name,
       COUNT(*) AS task_count
FROM tasks t
JOIN trips tr ON tr.trip_id = t.trip_id
GROUP BY t.trip_id, tr.trip_name
ORDER BY task_count DESC, t.trip_id;

-- Dashboard view: tasks with trip name and owner
SELECT t.task_id,
       t.title,
       t.due_date,
       tr.trip_id,
       tr.trip_name,
       u.user_id AS owner_user_id,
       u.display_name AS owner_name
FROM tasks t
JOIN trips tr ON tr.trip_id = t.trip_id
JOIN users u ON u.user_id = tr.owner_user_id
ORDER BY tr.trip_name, t.due_date NULLS LAST, t.task_id;


-- ============================================================
-- RESERVATIONS
-- ============================================================

-- Note: place_id can be left NULL until the places table is implemented.

-- Create a reservation for a trip
INSERT INTO reservations (trip_id, provider, confirmation_no, place_id)
VALUES (:trip_id, :provider, :confirmation_no, :place_id)
RETURNING reservation_id, trip_id, provider, confirmation_no, place_id;

-- Read one reservation by id
SELECT reservation_id, trip_id, provider, confirmation_no, place_id
FROM reservations
WHERE reservation_id = :reservation_id;

-- Read all reservations for a trip
SELECT reservation_id, trip_id, provider, confirmation_no, place_id
FROM reservations
WHERE trip_id = :trip_id
ORDER BY provider NULLS LAST, reservation_id;

-- Update reservation details
UPDATE reservations
SET provider = :provider,
    confirmation_no = :confirmation_no,
    place_id = :place_id
WHERE reservation_id = :reservation_id
RETURNING reservation_id, trip_id, provider, confirmation_no, place_id;

-- Move a reservation to a different trip
UPDATE reservations
SET trip_id = :trip_id
WHERE reservation_id = :reservation_id
RETURNING reservation_id, trip_id, provider, confirmation_no, place_id;

-- Delete a reservation
DELETE FROM reservations
WHERE reservation_id = :reservation_id
RETURNING reservation_id, trip_id, provider, confirmation_no, place_id;

-- Useful reservation queries

-- Lookup by confirmation number
SELECT reservation_id, trip_id, provider, confirmation_no, place_id
FROM reservations
WHERE confirmation_no = :confirmation_no;

-- Search reservations by provider
SELECT reservation_id, trip_id, provider, confirmation_no, place_id
FROM reservations
WHERE provider ILIKE '%' || :provider_search || '%'
ORDER BY provider, reservation_id;

-- Reservation count per trip
SELECT r.trip_id,
       tr.trip_name,
       COUNT(*) AS reservation_count
FROM reservations r
JOIN trips tr ON tr.trip_id = r.trip_id
GROUP BY r.trip_id, tr.trip_name
ORDER BY reservation_count DESC, r.trip_id;

-- Reservations missing linked place records
SELECT reservation_id, trip_id, provider, confirmation_no, place_id
FROM reservations
WHERE place_id IS NULL
ORDER BY reservation_id;

-- Dashboard view: reservations with trip name and owner
SELECT r.reservation_id,
       r.provider,
       r.confirmation_no,
       r.place_id,
       tr.trip_id,
       tr.trip_name,
       u.user_id AS owner_user_id,
       u.display_name AS owner_name
FROM reservations r
JOIN trips tr ON tr.trip_id = r.trip_id
JOIN users u ON u.user_id = tr.owner_user_id
ORDER BY tr.trip_name, r.provider NULLS LAST, r.reservation_id;
