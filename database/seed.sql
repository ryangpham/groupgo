-- Initial seed data goes here.
TRUNCATE TABLE expense_splits, expenses, reservations, tasks, places, memberships, trips, users, roles RESTART IDENTITY CASCADE;

-- All seeded users use the password: groupgo123

INSERT INTO roles (role_name)
VALUES ('owner'),
('admin'),
('member');

INSERT INTO users(email, display_name, password_hash)
VALUES ('johnsmith99@gmail.com', 'John Smith', '$2b$12$9Uvl6JMD7lyNCqkxqE2MC.I7sSvD83ljlZ2eUXyJkhQDyiHLnFJcG'),
('larplarplarpsahur@gmail.com', 'Charlie Brown', '$2b$12$9Uvl6JMD7lyNCqkxqE2MC.I7sSvD83ljlZ2eUXyJkhQDyiHLnFJcG'),
('andrii05@gmail.com', 'Andrii', '$2b$12$9Uvl6JMD7lyNCqkxqE2MC.I7sSvD83ljlZ2eUXyJkhQDyiHLnFJcG');

INSERT INTO trips(trip_name, start_date, end_date, owner_user_id)
VALUES ('Valhalla', '2026-04-24', '2026-05-07', (SELECT user_id FROM users WHERE email = 'larplarplarpsahur@gmail.com'));  


INSERT INTO memberships(user_id, trip_id, role_id)
VALUES ( (SELECT user_id FROM users WHERE email = 'larplarplarpsahur@gmail.com'), 
		(SELECT trip_id FROM trips WHERE trip_name = 'Valhalla'),
		(SELECT role_id FROM roles WHERE role_name = 'owner')
);

INSERT INTO memberships(user_id, trip_id, role_id)
VALUES ( (SELECT user_id FROM users WHERE email = 'johnsmith99@gmail.com'),
		(SELECT trip_id FROM trips WHERE trip_name = 'Valhalla'),
		(SELECT role_id FROM roles WHERE role_name = 'member')
),
(		(SELECT user_id FROM users WHERE email = 'andrii05@gmail.com'),
		(SELECT trip_id FROM trips WHERE trip_name = 'Valhalla'),
		(SELECT role_id FROM roles WHERE role_name = 'member')
);

INSERT INTO places(trip_id, place_name, address, rating, place_type)
VALUES (
		(SELECT trip_id FROM trips WHERE trip_name = 'Valhalla'),
		'Alila Villas Uluwatu',
		'Jl. Belimbing Sari, Pecatu, Bali',
		4.8,
		'Hotel'
),
(		(SELECT trip_id FROM trips WHERE trip_name = 'Valhalla'),
		'Locavore Restaurant',
		'Jl. Dewisita, Ubud, Bali',
		4.7,
		'Restaurant'
),
(		(SELECT trip_id FROM trips WHERE trip_name = 'Valhalla'),
		'Sunrise Volcano Trekking',
		'Kintamani, Bali',
		4.6,
		'Activity'
);

INSERT INTO tasks(trip_id, title, due_date, completed, assigned_user_id)
VALUES (
		(SELECT trip_id FROM trips WHERE trip_name = 'Valhalla'),
		'Book flights',
		'2026-06-15',
		TRUE,
		(SELECT user_id FROM users WHERE email = 'larplarplarpsahur@gmail.com')
),
(		(SELECT trip_id FROM trips WHERE trip_name = 'Valhalla'),
		'Reserve beach resort',
		'2026-06-20',
		TRUE,
		(SELECT user_id FROM users WHERE email = 'johnsmith99@gmail.com')
),
(		(SELECT trip_id FROM trips WHERE trip_name = 'Valhalla'),
		'Plan day trip itinerary',
		'2026-07-01',
		FALSE,
		(SELECT user_id FROM users WHERE email = 'larplarplarpsahur@gmail.com')
),
(		(SELECT trip_id FROM trips WHERE trip_name = 'Valhalla'),
		'Book snorkeling tour',
		'2026-07-05',
		FALSE,
		(SELECT user_id FROM users WHERE email = 'andrii05@gmail.com')
),
(		(SELECT trip_id FROM trips WHERE trip_name = 'Valhalla'),
		'Arrange airport transfers',
		'2026-07-10',
		FALSE,
		(SELECT user_id FROM users WHERE email = 'johnsmith99@gmail.com')
);

INSERT INTO reservations(trip_id, provider, place_name, reservation_type, reservation_date, confirmation_no, place_id)
VALUES (
		(SELECT trip_id FROM trips WHERE trip_name = 'Valhalla'),
		'Alila Villas Uluwatu',
		'Alila Villas Uluwatu',
		'Hotel',
		'2026-07-15',
		'ALV-2026-789456',
		(SELECT place_id FROM places WHERE place_name = 'Alila Villas Uluwatu')
),
(		(SELECT trip_id FROM trips WHERE trip_name = 'Valhalla'),
		'Locavore Restaurant',
		'Locavore Restaurant',
		'Restaurant',
		'2026-07-17',
		'LR-456789',
		(SELECT place_id FROM places WHERE place_name = 'Locavore Restaurant')
),
(		(SELECT trip_id FROM trips WHERE trip_name = 'Valhalla'),
		'Sunrise Volcano Trekking',
		'Sunrise Volcano Trekking',
		'Activity',
		'2026-07-19',
		'SVT-123456',
		(SELECT place_id FROM places WHERE place_name = 'Sunrise Volcano Trekking')
);

INSERT INTO expenses(trip_id, description, amount, expense_date, paid_by_user_id)
VALUES (
		(SELECT trip_id FROM trips WHERE trip_name = 'Valhalla'),
		'Villa deposit',
		900.00,
		'2026-04-25',
		(SELECT user_id FROM users WHERE email = 'larplarplarpsahur@gmail.com')
), (
		(SELECT trip_id FROM trips WHERE trip_name = 'Valhalla'),
		'Airport transfer',
		120.00,
		'2026-04-26',
		(SELECT user_id FROM users WHERE email = 'johnsmith99@gmail.com')
);

INSERT INTO expense_splits(expense_id, user_id, owed_amount, paid_amount)
VALUES
(
		1,
		(SELECT user_id FROM users WHERE email = 'larplarplarpsahur@gmail.com'),
		300.00,
		900.00
), (
		1,
		(SELECT user_id FROM users WHERE email = 'johnsmith99@gmail.com'),
		300.00,
		0.00
), (
		1,
		(SELECT user_id FROM users WHERE email = 'andrii05@gmail.com'),
		300.00,
		0.00
), (
		2,
		(SELECT user_id FROM users WHERE email = 'larplarplarpsahur@gmail.com'),
		40.00,
		0.00
), (
		2,
		(SELECT user_id FROM users WHERE email = 'johnsmith99@gmail.com'),
		40.00,
		120.00
), (
		2,
		(SELECT user_id FROM users WHERE email = 'andrii05@gmail.com'),
		40.00,
		0.00
);
