import pg from 'pg';

const phoneNumbers = [
  '+91 94824 76005',
  '+91 90350 35884',
  '+91 97411 70406'
];

async function updatePhones() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cities_of_future'
  });
  await client.connect();

  const usersRes = await client.query('SELECT id, name, email FROM users ORDER BY id ASC');
  console.log(`Found ${usersRes.rows.length} users to update.`);

  for (let i = 0; i < usersRes.rows.length; i++) {
    const user = usersRes.rows[i];
    const assignedPhone = phoneNumbers[i % phoneNumbers.length];
    await client.query('UPDATE users SET phone = $1, updated_at = NOW() WHERE id = $2', [assignedPhone, user.id]);
  }

  console.log(`Successfully updated all ${usersRes.rows.length} users with the 3 target phone numbers.`);

  // Verify
  const sample = await client.query('SELECT phone, count(*) FROM users GROUP BY phone');
  console.log('Phone distribution in users table:');
  console.table(sample.rows);

  await client.end();
}

updatePhones().catch(console.error);
