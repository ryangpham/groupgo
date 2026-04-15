CREATE TABLE IF NOT EXISTS expense (
    expense_id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trip(trip_id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS split (
    expense_id INTEGER NOT NULL REFERENCES expense(expense_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    trip_id INTEGER NOT NULL REFERENCES trip(trip_id) ON DELETE CASCADE,
    owed_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (owed_amount >= 0),
    paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    PRIMARY KEY (expense_id, user_id, trip_id)
);