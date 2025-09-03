-- Sample Family of 4 Transaction Data (Last 3 Months)
-- Family: Parents (John & Sarah) + 2 Kids (Emma 16, Max 12)
-- Mix of expenses including mortgage, utilities, groceries, entertainment, etc.

-- Clear existing data first
DELETE FROM transactions WHERE user_id = '42553967';
DELETE FROM recurring_transactions WHERE user_id = '42553967';

-- Sample Transactions for Family of 4 (May - August 2025)
INSERT INTO transactions (id, user_id, account_id, external_transaction_id, date, description, merchant, raw_amount, amount, category, type, source, is_pending) VALUES

-- === HOUSING & UTILITIES (Monthly) ===
-- Mortgage/Rent
('t1_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_mortgage_aug', '2025-08-15', 'WELLS FARGO MORTGAGE', 'Wells Fargo', '-2850.00', '2850.00', 'Housing', 'expense', 'plaid', false),
('t2_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_mortgage_jul', '2025-07-15', 'WELLS FARGO MORTGAGE', 'Wells Fargo', '-2850.00', '2850.00', 'Housing', 'expense', 'plaid', false),
('t3_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_mortgage_jun', '2025-06-15', 'WELLS FARGO MORTGAGE', 'Wells Fargo', '-2850.00', '2850.00', 'Housing', 'expense', 'plaid', false),
('t4_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_mortgage_may', '2025-05-15', 'WELLS FARGO MORTGAGE', 'Wells Fargo', '-2850.00', '2850.00', 'Housing', 'expense', 'plaid', false),

-- Electric Bill (PG&E)
('t5_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_pge_aug', '2025-08-08', 'PG&E ELECTRIC BILL', 'Pacific Gas & Electric', '-185.42', '185.42', 'Utilities', 'expense', 'plaid', false),
('t6_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_pge_jul', '2025-07-08', 'PG&E ELECTRIC BILL', 'Pacific Gas & Electric', '-201.88', '201.88', 'Utilities', 'expense', 'plaid', false),
('t7_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_pge_jun', '2025-06-08', 'PG&E ELECTRIC BILL', 'Pacific Gas & Electric', '-167.33', '167.33', 'Utilities', 'expense', 'plaid', false),
('t8_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_pge_may', '2025-05-08', 'PG&E ELECTRIC BILL', 'Pacific Gas & Electric', '-145.67', '145.67', 'Utilities', 'expense', 'plaid', false),

-- Water/Sewer
('t9_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_water_aug', '2025-08-12', 'CITY WATER DEPT', 'City Water Department', '-89.45', '89.45', 'Utilities', 'expense', 'plaid', false),
('t10_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_water_jun', '2025-06-12', 'CITY WATER DEPT', 'City Water Department', '-95.22', '95.22', 'Utilities', 'expense', 'plaid', false),
('t11_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_water_apr', '2025-04-12', 'CITY WATER DEPT', 'City Water Department', '-78.90', '78.90', 'Utilities', 'expense', 'plaid', false),

-- Internet/Phone
('t12_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_verizon_aug', '2025-08-25', 'VERIZON WIRELESS', 'Verizon', '-165.99', '165.99', 'Utilities', 'expense', 'plaid', false),
('t13_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_verizon_jul', '2025-07-25', 'VERIZON WIRELESS', 'Verizon', '-165.99', '165.99', 'Utilities', 'expense', 'plaid', false),
('t14_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_verizon_jun', '2025-06-25', 'VERIZON WIRELESS', 'Verizon', '-165.99', '165.99', 'Utilities', 'expense', 'plaid', false),
('t15_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_verizon_may', '2025-05-25', 'VERIZON WIRELESS', 'Verizon', '-165.99', '165.99', 'Utilities', 'expense', 'plaid', false),

-- === INSURANCE (Monthly/Quarterly) ===
-- Car Insurance
('t16_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_geico_aug', '2025-08-01', 'GEICO INSURANCE', 'Geico', '-245.80', '245.80', 'Insurance', 'expense', 'plaid', false),
('t17_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_geico_jul', '2025-07-01', 'GEICO INSURANCE', 'Geico', '-245.80', '245.80', 'Insurance', 'expense', 'plaid', false),
('t18_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_geico_jun', '2025-06-01', 'GEICO INSURANCE', 'Geico', '-245.80', '245.80', 'Insurance', 'expense', 'plaid', false),

-- Health Insurance (Quarterly)
('t19_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_anthem_jul', '2025-07-15', 'ANTHEM BLUE CROSS', 'Anthem', '-890.00', '890.00', 'Insurance', 'expense', 'plaid', false),
('t20_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_anthem_apr', '2025-04-15', 'ANTHEM BLUE CROSS', 'Anthem', '-890.00', '890.00', 'Insurance', 'expense', 'plaid', false),

-- === SUBSCRIPTIONS & ENTERTAINMENT ===
-- Netflix
('t21_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_netflix_aug', '2025-08-22', 'NETFLIX.COM', 'Netflix', '-15.99', '15.99', 'Subscriptions & Entertainment', 'expense', 'plaid', false),
('t22_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_netflix_jul', '2025-07-22', 'NETFLIX.COM', 'Netflix', '-15.99', '15.99', 'Subscriptions & Entertainment', 'expense', 'plaid', false),
('t23_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_netflix_jun', '2025-06-22', 'NETFLIX.COM', 'Netflix', '-15.99', '15.99', 'Subscriptions & Entertainment', 'expense', 'plaid', false),

-- Disney+
('t24_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_disney_aug', '2025-08-14', 'DISNEY PLUS', 'Disney', '-13.99', '13.99', 'Subscriptions & Entertainment', 'expense', 'plaid', false),
('t25_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_disney_jul', '2025-07-14', 'DISNEY PLUS', 'Disney', '-13.99', '13.99', 'Subscriptions & Entertainment', 'expense', 'plaid', false),

-- Spotify Family
('t26_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_spotify_aug', '2025-08-05', 'SPOTIFY USA', 'Spotify', '-15.99', '15.99', 'Subscriptions & Entertainment', 'expense', 'plaid', false),
('t27_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_spotify_jul', '2025-07-05', 'SPOTIFY USA', 'Spotify', '-15.99', '15.99', 'Subscriptions & Entertainment', 'expense', 'plaid', false),

-- Amazon Prime
('t28_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_amazon_jul', '2025-07-28', 'AMAZON PRIME', 'Amazon', '-14.99', '14.99', 'Subscriptions & Entertainment', 'expense', 'plaid', false),
('t29_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_amazon_jun', '2025-06-28', 'AMAZON PRIME', 'Amazon', '-14.99', '14.99', 'Subscriptions & Entertainment', 'expense', 'plaid', false),

-- === GROCERIES & DINING ===
-- Weekly Grocery Shopping (Safeway, Costco, Target)
('t30_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_safeway_aug1', '2025-08-17', 'SAFEWAY #1234', 'Safeway', '-187.43', '187.43', 'Groceries', 'expense', 'plaid', false),
('t31_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_safeway_aug2', '2025-08-10', 'SAFEWAY #1234', 'Safeway', '-203.67', '203.67', 'Groceries', 'expense', 'plaid', false),
('t32_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_costco_aug', '2025-08-03', 'COSTCO WHOLESALE', 'Costco', '-342.89', '342.89', 'Groceries', 'expense', 'plaid', false),
('t33_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_safeway_jul1', '2025-07-27', 'SAFEWAY #1234', 'Safeway', '-156.78', '156.78', 'Groceries', 'expense', 'plaid', false),
('t34_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_target_jul', '2025-07-20', 'TARGET T-1234', 'Target', '-298.45', '298.45', 'Groceries', 'expense', 'plaid', false),
('t35_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_costco_jul', '2025-07-06', 'COSTCO WHOLESALE', 'Costco', '-387.22', '387.22', 'Groceries', 'expense', 'plaid', false),

-- Restaurant Dining
('t36_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_chipotle_aug', '2025-08-16', 'CHIPOTLE 2157', 'Chipotle', '-67.89', '67.89', 'Dining', 'expense', 'plaid', false),
('t37_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_pizza_aug', '2025-08-09', 'DOMINOS PIZZA', 'Dominos', '-43.56', '43.56', 'Dining', 'expense', 'plaid', false),
('t38_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_starbucks_aug', '2025-08-14', 'STARBUCKS', 'Starbucks', '-12.45', '12.45', 'Dining', 'expense', 'plaid', false),
('t39_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_olive_jul', '2025-07-13', 'OLIVE GARDEN', 'Olive Garden', '-89.34', '89.34', 'Dining', 'expense', 'plaid', false),

-- === TRANSPORTATION ===
-- Gas Stations
('t40_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_shell_aug1', '2025-08-15', 'SHELL OIL', 'Shell', '-52.89', '52.89', 'Transportation', 'expense', 'plaid', false),
('t41_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_chevron_aug', '2025-08-08', 'CHEVRON', 'Chevron', '-48.67', '48.67', 'Transportation', 'expense', 'plaid', false),
('t42_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_shell_jul', '2025-07-26', 'SHELL OIL', 'Shell', '-49.23', '49.23', 'Transportation', 'expense', 'plaid', false),

-- Car Maintenance
('t43_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_jiffy_jul', '2025-07-18', 'JIFFY LUBE', 'Jiffy Lube', '-89.99', '89.99', 'Transportation', 'expense', 'plaid', false),

-- === KIDS & FAMILY ===
-- School Supplies/Activities
('t44_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_staples_aug', '2025-08-20', 'STAPLES', 'Staples', '-156.78', '156.78', 'Family & Kids', 'expense', 'plaid', false),
('t45_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_sports_jul', '2025-07-15', 'DICKS SPORTING GOODS', 'Dicks Sporting Goods', '-234.56', '234.56', 'Family & Kids', 'expense', 'plaid', false),

-- Kids Activities
('t46_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_piano_aug', '2025-08-01', 'MUSIC LESSONS PLUS', 'Music Lessons Plus', '-120.00', '120.00', 'Family & Kids', 'expense', 'plaid', false),
('t47_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_piano_jul', '2025-07-01', 'MUSIC LESSONS PLUS', 'Music Lessons Plus', '-120.00', '120.00', 'Family & Kids', 'expense', 'plaid', false),

-- === HEALTHCARE ===
-- Doctor visits, pharmacy
('t48_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_cvs_aug', '2025-08-11', 'CVS PHARMACY', 'CVS', '-67.89', '67.89', 'Healthcare', 'expense', 'plaid', false),
('t49_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_dentist_jul', '2025-07-22', 'FAMILY DENTAL CARE', 'Family Dental Care', '-185.00', '185.00', 'Healthcare', 'expense', 'plaid', false),

-- === INCOME ===
-- John's Salary (bi-weekly)
('t50_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_salary_aug2', '2025-08-16', 'PAYROLL DEPOSIT TECH CORP', 'Tech Corp', '3245.67', '3245.67', 'Salary', 'income', 'plaid', false),
('t51_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_salary_aug1', '2025-08-02', 'PAYROLL DEPOSIT TECH CORP', 'Tech Corp', '3245.67', '3245.67', 'Salary', 'income', 'plaid', false),
('t52_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_salary_jul2', '2025-07-19', 'PAYROLL DEPOSIT TECH CORP', 'Tech Corp', '3245.67', '3245.67', 'Salary', 'income', 'plaid', false),
('t53_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_salary_jul1', '2025-07-05', 'PAYROLL DEPOSIT TECH CORP', 'Tech Corp', '3245.67', '3245.67', 'Salary', 'income', 'plaid', false),

-- Sarah's Part-time job (monthly)
('t54_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_consult_aug', '2025-08-30', 'CONSULTING SERVICES INC', 'Consulting Services', '1850.00', '1850.00', 'Freelance', 'income', 'plaid', false),
('t55_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_consult_jul', '2025-07-30', 'CONSULTING SERVICES INC', 'Consulting Services', '1850.00', '1850.00', 'Freelance', 'income', 'plaid', false),

-- === MISCELLANEOUS ===
-- Amazon purchases, misc shopping
('t56_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_amazon_aug1', '2025-08-12', 'AMAZON.COM', 'Amazon', '-89.47', '89.47', 'Shopping', 'expense', 'plaid', false),
('t57_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_amazon_jul1', '2025-07-08', 'AMAZON.COM', 'Amazon', '-145.23', '145.23', 'Shopping', 'expense', 'plaid', false),

-- Home Improvement 
('t58_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_homedepot_jun', '2025-06-25', 'HOME DEPOT', 'Home Depot', '-267.89', '267.89', 'Home Improvement', 'expense', 'plaid', false),

-- Gym Membership
('t59_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_gym_aug', '2025-08-03', 'LA FITNESS', 'LA Fitness', '-89.99', '89.99', 'Health & Fitness', 'expense', 'plaid', false),
('t60_' || generate_random_uuid(), '42553967', 'dd6b6454-9d79-48d0-ac92-9ef6c52e9b63', 'ext_gym_jul', '2025-07-03', 'LA FITNESS', 'LA Fitness', '-89.99', '89.99', 'Health & Fitness', 'expense', 'plaid', false);