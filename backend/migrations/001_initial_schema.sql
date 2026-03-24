-- Investment Marketplace - Initial Schema for Supabase PostgreSQL
-- Run this in Supabase SQL Editor

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('investor', 'business', 'admin');
CREATE TYPE project_status AS ENUM ('pending', 'active', 'closed', 'suspended');
CREATE TYPE payment_status AS ENUM ('pending', 'paid');
CREATE TYPE investment_status AS ENUM ('active', 'sold', 'matured');
CREATE TYPE deposit_status AS ENUM ('pending', 'confirmed', 'failed');
CREATE TYPE payout_status AS ENUM ('pending', 'processed', 'failed');
CREATE TYPE file_type AS ENUM ('presentation', 'visual', 'document');

-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'investor'::user_role,
  avatar TEXT,
  balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
  wallet_address TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT users_balance_nonnegative CHECK (balance >= 0)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Projects table
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  payout_frequency TEXT NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL,
  min_investment DECIMAL(10, 2) NOT NULL DEFAULT 1000,
  max_investment DECIMAL(10, 2),
  total_pool DECIMAL(12, 2) NOT NULL DEFAULT 0,
  funded_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status project_status NOT NULL DEFAULT 'pending'::project_status,
  payment_status payment_status NOT NULL DEFAULT 'pending'::payment_status,
  category TEXT,
  risk_level TEXT DEFAULT 'medium',
  duration_months INTEGER NOT NULL DEFAULT 12,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT projects_funded_lte_pool CHECK (funded_amount <= total_pool)
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_payment_status ON projects(payment_status);

-- Project files table
CREATE TABLE project_files (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type file_type NOT NULL,
  mime_type TEXT,
  size INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_files_project_id ON project_files(project_id);

-- Deposits table
CREATE TABLE deposits (
  id TEXT PRIMARY KEY,
  investor_id TEXT NOT NULL REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  tx_hash TEXT,
  status deposit_status NOT NULL DEFAULT 'pending'::deposit_status,
  blockchain_verified INTEGER NOT NULL DEFAULT 0,
  confirmation_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT deposits_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_deposits_investor_id ON deposits(investor_id);
CREATE INDEX idx_deposits_status ON deposits(status);

-- Investments table
CREATE TABLE investments (
  id TEXT PRIMARY KEY,
  investor_id TEXT NOT NULL REFERENCES users(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  amount DECIMAL(10, 2) NOT NULL,
  status investment_status NOT NULL DEFAULT 'active'::investment_status,
  purchase_price DECIMAL(10, 2) NOT NULL,
  current_value DECIMAL(10, 2) NOT NULL,
  interest_earned DECIMAL(10, 2) NOT NULL DEFAULT 0,
  last_payout TIMESTAMP,
  paid_from_balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT investments_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_investments_investor_id ON investments(investor_id);
CREATE INDEX idx_investments_project_id ON investments(project_id);
CREATE INDEX idx_investments_status ON investments(status);

-- Payouts table
CREATE TABLE payouts (
  id TEXT PRIMARY KEY,
  investment_id TEXT NOT NULL REFERENCES investments(id),
  investor_id TEXT NOT NULL REFERENCES users(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  amount DECIMAL(10, 2) NOT NULL,
  status payout_status NOT NULL DEFAULT 'pending'::payout_status,
  scheduled_date TIMESTAMP NOT NULL,
  processed_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT payouts_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_payouts_investor_id ON payouts(investor_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_scheduled_date ON payouts(scheduled_date);

-- Ratings table
CREATE TABLE ratings (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  investor_id TEXT NOT NULL REFERENCES users(id),
  payout_reliability INTEGER NOT NULL CHECK (payout_reliability BETWEEN 1 AND 5),
  transparency INTEGER NOT NULL CHECK (transparency BETWEEN 1 AND 5),
  overall INTEGER NOT NULL CHECK (overall BETWEEN 1 AND 5),
  feedback TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, investor_id)
);

CREATE INDEX idx_ratings_project_id ON ratings(project_id);
CREATE INDEX idx_ratings_investor_id ON ratings(investor_id);

-- Market listings table (Secondary Market)
CREATE TABLE market_listings (
  id TEXT PRIMARY KEY,
  investment_id TEXT NOT NULL REFERENCES investments(id),
  seller_id TEXT NOT NULL REFERENCES users(id),
  asking_price DECIMAL(10, 2) NOT NULL,
  original_amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_market_listings_seller_id ON market_listings(seller_id);
CREATE INDEX idx_market_listings_status ON market_listings(status);

-- Create RLS (Row Level Security) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- Users: Users can only see themselves, admins can see all
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id OR role = 'admin');

-- Deposits: Users can only see their own deposits
CREATE POLICY "Users can view own deposits" ON deposits
  FOR SELECT USING (auth.uid()::text = investor_id);

CREATE POLICY "Users can create own deposits" ON deposits
  FOR INSERT WITH CHECK (auth.uid()::text = investor_id);

-- Investments: Users can only see their own investments
CREATE POLICY "Users can view own investments" ON investments
  FOR SELECT USING (auth.uid()::text = investor_id);

CREATE POLICY "Users can create investments" ON investments
  FOR INSERT WITH CHECK (auth.uid()::text = investor_id);
