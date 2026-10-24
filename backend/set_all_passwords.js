import pg from 'pg';
import bcrypt from 'bcryptjs';

async function setAllPasswords() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cities_of_future'
  });
  await client.connect();

  const hash = await bcrypt.hash('password123', 10);
  const res = await client.query('UPDATE users SET password_hash = $1', [hash]);
  console.log(`Updated all ${res.rowCount} users password to 'password123'`);

  // Verify
  const sample = await client.query('SELECT id, name, email, role, phone FROM users LIMIT 10');
  console.table(sample.rows);

  await client.end();
}

setAllPasswords().catch(console.error);
