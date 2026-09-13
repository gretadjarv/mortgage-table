-- Create table: loans
CREATE TABLE IF NOT EXISTS loans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  start_sum REAL,
  interest_rate REAL,
  amortization REAL,
  start_date TEXT
);

-- Insert data into loans
INSERT OR REPLACE INTO loans (id, start_sum, interest_rate, amortization, start_date) VALUES
(1, 543755.00, 4.35, 0.00, '2024-07-20'),
(8, 516995.00, 4.33, 1500.00, '2024-07-20'),
(9, 487390.00, 4.42, 100.00, '2024-07-20');

-- Create table: loan_updates
CREATE TABLE IF NOT EXISTS loan_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loan_id INTEGER,
  updated_amortization REAL,
  updated_interest_rate REAL,
  update_date TEXT,
  FOREIGN KEY (loan_id) REFERENCES loans(id)
);

-- Insert data into loan_updates
INSERT OR REPLACE INTO loan_updates (id, loan_id, updated_amortization, updated_interest_rate, update_date) VALUES
(9, 1, 0.00, 3.69, '2024-09-25'),
(13, 9, 500.00, 4.42, '2024-12-01');

CREATE TABLE IF NOT EXISTS one_time_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loan_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  payment_date TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loans(id)
);
