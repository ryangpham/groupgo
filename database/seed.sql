-- Initial seed data goes here.
TRUNCATE TABLE memberships, trips, users, roles RESTART IDENTITY CASCADE;

INSERT INTO roles (role_name)
VALUES ('owner'),
('admin'),
('member');

INSERT INTO users(email, display_name)
VALUES ('johnsmith99@gmail.com', 'John Smith'),
('larplarplarpsahur@gmail.com', 'Charlie Kirk'),
('andrii05@gmail.com', 'Andrii');

INSERT INTO trips(trip_name, start_date, end_date, owner_user_id)
VALUES ('Valhalla', '2026-04-24', '2026-05-07', (SELECT user_id FROM users WHERE email = 'larplarplarpsahur@gmail.com'));  


INSERT INTO memberships(user_id, trip_id, role_id)
VALUES ( (SELECT user_id FROM users WHERE email = 'larplarplarpsahur@gmail.com'), 
		(SELECT trip_id FROM trips WHERE trip_name = 'Valhalla'),
		(SELECT role_id FROM roles WHERE role_name = 'owner')
);

