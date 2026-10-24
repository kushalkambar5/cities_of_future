import pg from 'pg';

async function updateSampleStatuses() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cities_of_future'
  });
  await client.connect();

  // Set violations 2 to 7 as PENDING_VERIFICATION
  await client.query("UPDATE violations SET status = 'PENDING_VERIFICATION' WHERE id BETWEEN 2 AND 7");
  
  // Set violation 1 as VERIFIED
  await client.query("UPDATE violations SET status = 'VERIFIED' WHERE id = 1");

  const res = await client.query('SELECT status, count(*) FROM violations GROUP BY status');
  console.log('Current violation statuses in DB:');
  console.table(res.rows);

  await client.end();
}

updateSampleStatuses().catch(console.error);
