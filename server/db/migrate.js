// server/db/migrate.js
import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const schema = `
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
`;

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function migrate() {
  try {
    console.log('Starting database migration...');

    // Execute schema
    await pool.query(schema);
    console.log('Schema created successfully');

    // Insert initial admin users
    const users = [
      ['super_admin', await hashPassword('admin2024'), 'SUPER_ADMIN', 0],
      ['hq_apo', await hashPassword('hq2024'), 'APO', 1],
      ['malda_apo', await hashPassword('malda2024'), 'APO', 2],
      ['hwh_apo', await hashPassword('hwh2024'), 'APO', 3],
      ['sdah_apo', await hashPassword('sdah2024'), 'APO', 4],
      ['llh_apo', await hashPassword('llh2024'), 'APO', 5],
      ['kpa_apo', await hashPassword('kpa2024'), 'APO', 6],
      ['jmp_apo', await hashPassword('jmp2024'), 'APO', 7],
      ['asl_apo', await hashPassword('asl2024'), 'APO', 8],
      ['hq_po', await hashPassword('hq@2024'), 'PO', 1],
      ['malda_po', await hashPassword('malda@2024'), 'PO', 2],
      ['hwh_po', await hashPassword('hwh@2024'), 'PO', 3],
      ['sdah_po', await hashPassword('sdah@2024'), 'PO', 4],
      ['llh_po', await hashPassword('llh@2024'), 'PO', 5],
      ['kpa_po', await hashPassword('kpa@2024'), 'PO', 6],
      ['jmp_po', await hashPassword('jmp@2024'), 'PO', 7],
      ['asl_po', await hashPassword('asl@2024'), 'PO', 8]
    ];

    for (const [username, password, role, placeId] of users) {
      await pool.query(
        'INSERT INTO users (username, password, role, place_id) VALUES ($1, $2, $3, $4)',
        [username, password, role, placeId]
      );
    }
    console.log('Users created successfully');

    const votingDates = [
      ['2024-12-04', false, false],
      ['2024-12-05', false, false],
      ['2024-12-06', false, false],
      ['2024-12-10', false, false]
    ];

    for (const [date, isActive, isComplete] of votingDates) {
      await pool.query(
        'INSERT INTO voting_dates (date, is_active, is_complete) VALUES ($1, $2, $3)',
        [date, isActive, isComplete]
      );
    }
    console.log('Voting dates created successfully');

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();