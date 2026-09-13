-- Run AFTER creating a Supabase account.
-- Replace YOUR-USER-UUID with the UUID shown on /loanCalculator/setup.
-- These are the loans from the old loan_calculator.sql.

insert into public.loans (user_id, start_sum, interest_rate, amortization, start_date) values
('YOUR-USER-UUID', 543755.00, 4.35, 0.00, '2024-07-20'),
('YOUR-USER-UUID', 516995.00, 4.33, 1500.00, '2024-07-20'),
('YOUR-USER-UUID', 487390.00, 4.42, 100.00, '2024-07-20');

-- After the three loan rows exist, get their new IDs and add the historical updates.
-- Example: replace NEW_LOAN_ID_1 and NEW_LOAN_ID_3 below.

-- insert into public.loan_updates
-- (user_id, loan_id, updated_amortization, updated_interest_rate, update_date)
-- values
-- ('YOUR-USER-UUID', NEW_LOAN_ID_1, 0.00, 3.69, '2024-09-25'),
-- ('YOUR-USER-UUID', NEW_LOAN_ID_3, 500.00, 4.42, '2024-12-01');
