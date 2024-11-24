-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('APO', 'PO', 'SUPER_ADMIN')),
  place_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create places table
CREATE TABLE places (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  total_voters INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create voting_dates table
CREATE TABLE voting_dates (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT false,
  is_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create voting_data table
CREATE TABLE voting_data (
  id SERIAL PRIMARY KEY,
  place_id INTEGER REFERENCES places(id),
  votes_count INTEGER NOT NULL,
  male_voters INTEGER NOT NULL,
  female_voters INTEGER NOT NULL,
  date DATE NOT NULL,
  submitted_by_user_id INTEGER REFERENCES users(id),
  submitted_by_role VARCHAR(20) NOT NULL,
  submitted_by_place_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create system_logs table
CREATE TABLE system_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  performed_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert places data
INSERT INTO places (name, total_voters) VALUES
  ('Headquarter', 3296),
  ('Malda Division', 9962),
  ('Howrah Division', 25224),
  ('Sealdah Division', 21038),
  ('Liluah Workshop', 6709),
  ('Kanchrapara Workshop', 7346),
  ('Jamalpur Workshop', 6909),
  ('Asansol Division', 17257);

-- Create indexes
CREATE INDEX idx_voting_data_place_id ON voting_data(place_id);
CREATE INDEX idx_voting_data_date ON voting_data(date);
CREATE INDEX idx_voting_dates_date ON voting_dates(date);
CREATE INDEX idx_system_logs_action ON system_logs(action);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);