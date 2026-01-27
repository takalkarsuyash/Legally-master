-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 0. Create user_documents table (Requested by user)
CREATE TABLE IF NOT EXISTS public.user_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_id TEXT,
  doc_url TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  document_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON public.user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_created_at ON public.user_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_documents_document_type ON public.user_documents(document_type);

-- Enable RLS for user_documents
alter table public.user_documents enable row level security;

-- Policies for user_documents
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_documents' AND policyname = 'Users can view their own documents') THEN
        create policy "Users can view their own documents" on public.user_documents for select using ( auth.uid() = user_id );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_documents' AND policyname = 'Users can insert their own documents') THEN
        create policy "Users can insert their own documents" on public.user_documents for insert with check ( auth.uid() = user_id );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_documents' AND policyname = 'Users can update their own documents') THEN
        create policy "Users can update their own documents" on public.user_documents for update using ( auth.uid() = user_id );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_documents' AND policyname = 'Users can delete their own documents') THEN
        create policy "Users can delete their own documents" on public.user_documents for delete using ( auth.uid() = user_id );
    END IF;
END $$;


-- 1. Create user_profiles table
create table IF NOT EXISTS public.user_profiles (
  id uuid references auth.users not null primary key,
  username text,
  name text,
  surname text,
  wallet_id text unique,
  profile_url text, -- To store avatar URL if needed
  updated_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Enable RLS for user_profiles
alter table public.user_profiles enable row level security;

-- Policies for user_profiles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can view their own profile') THEN
        create policy "Users can view their own profile" on public.user_profiles for select using ( auth.uid() = id );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can update their own profile') THEN
        create policy "Users can update their own profile" on public.user_profiles for update using ( auth.uid() = id );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can insert their own profile') THEN
        create policy "Users can insert their own profile" on public.user_profiles for insert with check ( auth.uid() = id );
    END IF;
END $$;

-- 2. Create cases table
create table IF NOT EXISTS public.cases (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  court text,
  next_hearing timestamp with time zone,
  status text default 'active',
  documents jsonb default '[]'::jsonb, -- Array of document objects
  notes text,
  calendar_event_id text,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Enable RLS for cases
alter table public.cases enable row level security;

-- Policies for cases
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cases' AND policyname = 'Users can view their own cases') THEN
        create policy "Users can view their own cases" on public.cases for select using ( auth.uid() = user_id );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cases' AND policyname = 'Users can insert their own cases') THEN
        create policy "Users can insert their own cases" on public.cases for insert with check ( auth.uid() = user_id );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cases' AND policyname = 'Users can update their own cases') THEN
        create policy "Users can update their own cases" on public.cases for update using ( auth.uid() = user_id );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cases' AND policyname = 'Users can delete their own cases') THEN
        create policy "Users can delete their own cases" on public.cases for delete using ( auth.uid() = user_id );
    END IF;
END $$;

-- 3. Create reminders table
create table IF NOT EXISTS public.reminders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  date date not null,
  time time without time zone,
  priority text default 'medium', -- low, medium, high
  calendar_event_id text,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Enable RLS for reminders
alter table public.reminders enable row level security;

-- Policies for reminders
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reminders' AND policyname = 'Users can view their own reminders') THEN
        create policy "Users can view their own reminders" on public.reminders for select using ( auth.uid() = user_id );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reminders' AND policyname = 'Users can insert their own reminders') THEN
        create policy "Users can insert their own reminders" on public.reminders for insert with check ( auth.uid() = user_id );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reminders' AND policyname = 'Users can update their own reminders') THEN
        create policy "Users can update their own reminders" on public.reminders for update using ( auth.uid() = user_id );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reminders' AND policyname = 'Users can delete their own reminders') THEN
        create policy "Users can delete their own reminders" on public.reminders for delete using ( auth.uid() = user_id );
    END IF;
END $$;


-- 4. Create user_tokens table (for your token system)
create table IF NOT EXISTS public.user_tokens (
  user_id uuid references auth.users not null primary key,
  token_balance numeric default 0,
  total_earned numeric default 0,
  total_spent numeric default 0,
  last_transaction timestamp with time zone,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Enable RLS for user_tokens
alter table public.user_tokens enable row level security;

-- Policies for user_tokens
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_tokens' AND policyname = 'Users can view their own tokens') THEN
        create policy "Users can view their own tokens" on public.user_tokens for select using ( auth.uid() = user_id );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_tokens' AND policyname = 'Users can update their own tokens') THEN
        create policy "Users can update their own tokens" on public.user_tokens for update using ( auth.uid() = user_id );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_tokens' AND policyname = 'Users can insert their own tokens') THEN
        create policy "Users can insert their own tokens" on public.user_tokens for insert with check ( auth.uid() = user_id );
    END IF;
END $$;


-- 5. Create token_transactions table (history)
create table IF NOT EXISTS public.token_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  transaction_type text not null, -- 'earned', 'spent', 'purchased'
  amount numeric not null,
  feature_used text,
  eth_amount numeric,
  transaction_hash text,
  description text,
  created_at timestamp with time zone default now()
);

-- Enable RLS for token_transactions
alter table public.token_transactions enable row level security;

-- Policies for token_transactions
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'token_transactions' AND policyname = 'Users can view their own transaction history') THEN
        create policy "Users can view their own transaction history" on public.token_transactions for select using ( auth.uid() = user_id );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'token_transactions' AND policyname = 'Users can insert their own transactions') THEN
        create policy "Users can insert their own transactions" on public.token_transactions for insert with check ( auth.uid() = user_id );
    END IF;
END $$;
