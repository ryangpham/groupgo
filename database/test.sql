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
VALUES ('Tel Aviv Spring 2026', '2026-05-24', '2026-04-07', (SELECT user_id FROM users WHERE email = 'charliekirk88@yahoo.com'));  