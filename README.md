# Mortgage Table

A SvelteKit mortgage tracker deployed to GitHub Pages with Supabase.

## Features

- Multiple loans with names, starting balance, interest rate, amortization and start date
- Monthly projection for up to 50 years
- Monthly cost split into interest and amortization
- Remaining balance per loan and total balance
- Historical payment/rate changes
- One-time amortization payments
- Historical absolute balance adjustments for loan transfers/refinancing/bank corrections
- Edit/delete support for loans and historical events
- Supabase authentication and row-level security

## Supabase

Run the SQL in `supabase.sql`. If the original three tables already exist, only the final `loan_balance_adjustments` section needs to be added.

Set GitHub Actions secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Historical balance adjustment

Use **Set Historical Balance** inside a loan's Updates panel when the actual balance becomes a known amount on a specific date. Example: if a loan is transferred on 2026-01-15 and the new bank says the balance is 366,097 SEK, save 366,097 with that date. The projection then uses that balance from that point onward while keeping the normal interest/amortization calculations.

For an adjustment that represents the balance *after* a month's payment, use the following month's date (or otherwise choose the date carefully) so the simulator does not amortize the same period twice.
