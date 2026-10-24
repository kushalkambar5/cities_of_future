import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from './node_modules/pg/lib/index.js';
import bcrypt from './node_modules/bcryptjs/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_PHONE_NUMBERS = [
  '+91 94824 76005',
  '+91 90350 35884',
  '+91 97411 70406',
];

const NAMES = [
  'Aarav Sharma', 'Aditi Rao', 'Akshay Kumar', 'Ananya Iyer', 'Arjun Patel',
  'Bhavna Mehta', 'Chetan Bhagat', 'Deepa Shenoy', 'Divya Suresh', 'Gautam Menon',
  'Harish Rao', 'Isha Ambani', 'Kavya Madhavan', 'Kiran Kulkarni', 'Kunal Roy',
  'Manish Malhotra', 'Meera Nair', 'Naveen Prasad', 'Neha Kakkar', 'Nikhil Kamath',
  'Pooja Hegde', 'Pranav Mohan', 'Priya Mani', 'Radhika Nair', 'Rahul Dravid',
  'Rajesh Khanna', 'Ramesh Kumar', 'Rhea Chakraborty', 'Rohan Bopanna', 'Rohit Sharma',
  'Sachin Tendulkar', 'Sanjay Dutt', 'Shalini Reddy', 'Shreya Ghoshal', 'Siddharth Joshi',
  'Sneha Deshmukh', 'Sunil Gavaskar', 'Sunita Verma', 'Suresh Raina', 'Tanvi Sawant',
  'Varun Dhawan', 'Vidya Balan', 'Vijay Mallya', 'Vikram Malhotra', 'Virat Kohli',
  'Abhishek Bachchan', 'Aishwarya Rai', 'Amitabh Bachchan', 'Anil Kapoor', 'Deepika Padukone',
  'Hrithik Roshan', 'Kareena Kapoor', 'Katrina Kaif', 'Ranbir Kapoor', 'Ranveer Singh',
  'Salman Khan', 'Shah Rukh Khan', 'Shahid Kapoor', 'Sonam Kapoor', 'Alia Bhatt'
];

async function seedHardcodedVehicles() {
  const jsonPath = path.resolve(__dirname, '../models/src/api/routes/hardcoded_outputs.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`JSON file not found at: ${jsonPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const hardcodedData = JSON.parse(raw);

  // Collect all unique vehicles from the hardcoded JSON
  const plateMap = new Map();
  for (const [videoName, val] of Object.entries(hardcodedData)) {
    const vehList = val.vehicles || [];
    for (const veh of vehList) {
      const plate = (veh.number_plate || '').trim().toUpperCase();
      if (!plate) continue;
      if (!plateMap.has(plate)) {
        plateMap.set(plate, {
          plate,
          helmetStatus: veh.helmet_status,
          seatbeltStatus: veh.seatbelt_status,
          sourceVideo: videoName,
          trackId: veh.track_id
        });
      }
    }
  }

  console.log(`Found ${plateMap.size} unique vehicle plate numbers in hardcoded_outputs.json.`);

  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cities_of_future'
  });
  await client.connect();

  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  // Fetch all existing vehicles and users
  const existingVehsRes = await client.query('SELECT plate_number, owner_id FROM vehicles');
  const existingPlates = new Set(existingVehsRes.rows.map(r => r.plate_number.toUpperCase()));

  console.log(`Currently ${existingPlates.size} vehicles exist in the database.`);

  let createdUsersCount = 0;
  let createdVehiclesCount = 0;
  let updatedUsersCount = 0;

  let phoneIndex = 0;
  let nameIndex = 0;

  for (const [plate, vehInfo] of plateMap.entries()) {
    if (existingPlates.has(plate)) {
      // Vehicle exists, verify owner has one of the target phone numbers
      continue;
    }

    const cleanCode = plate.toLowerCase().replace(/[^a-z0-9]/g, '') || `veh${createdVehiclesCount}`;
    const email = `owner_${cleanCode}@navanagar.gov.in`;
    const ownerName = NAMES[nameIndex % NAMES.length];
    nameIndex++;

    const assignedPhone = TARGET_PHONE_NUMBERS[phoneIndex % TARGET_PHONE_NUMBERS.length];
    phoneIndex++;

    // Check if user already exists with this email
    let userRes = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    let userId = userRes.rows[0]?.id;

    if (!userId) {
      const insertUserRes = await client.query(
        `INSERT INTO users (name, email, password_hash, phone, role, status)
         VALUES ($1, $2, $3, $4, 'CITIZEN', 'ACTIVE')
         RETURNING id`,
        [ownerName, email, defaultPasswordHash, assignedPhone]
      );
      userId = insertUserRes.rows[0].id;
      createdUsersCount++;
    }

    // Determine vehicle type
    const isMotorcycle =
      (vehInfo.helmetStatus && vehInfo.helmetStatus !== 'unknown') ||
      vehInfo.sourceVideo.toLowerCase().includes('helmet');
    const vehicleType = isMotorcycle ? 'MOTORCYCLE' : 'CAR';

    // Insert vehicle
    await client.query(
      `INSERT INTO vehicles (plate_number, owner_id, vehicle_type)
       VALUES ($1, $2, $3)`,
      [plate, userId, vehicleType]
    );
    createdVehiclesCount++;
    existingPlates.add(plate);
  }

  // Ensure ALL users in the system have strictly one of the 3 target phone numbers
  const allUsersRes = await client.query('SELECT id, phone FROM users ORDER BY id ASC');
  for (let i = 0; i < allUsersRes.rows.length; i++) {
    const u = allUsersRes.rows[i];
    if (!TARGET_PHONE_NUMBERS.includes(u.phone)) {
      const assignedPhone = TARGET_PHONE_NUMBERS[i % TARGET_PHONE_NUMBERS.length];
      await client.query('UPDATE users SET phone = $1, updated_at = NOW() WHERE id = $2', [assignedPhone, u.id]);
      updatedUsersCount++;
    }
  }

  // Summary
  console.log('\n=== SEEDING SUMMARY ===');
  console.log(`Created ${createdUsersCount} new users.`);
  console.log(`Created ${createdVehiclesCount} new vehicles.`);
  console.log(`Updated phone numbers for ${updatedUsersCount} existing users.`);

  const totalVehiclesRes = await client.query('SELECT count(*) FROM vehicles');
  const totalUsersRes = await client.query('SELECT count(*) FROM users');
  console.log(`Total vehicles in DB: ${totalVehiclesRes.rows[0].count}`);
  console.log(`Total users in DB: ${totalUsersRes.rows[0].count}`);

  console.log('\nPhone number distribution across all users:');
  const phoneDist = await client.query('SELECT phone, count(*) FROM users GROUP BY phone ORDER BY count DESC');
  console.table(phoneDist.rows);

  // Sample check: verify 5 hardcoded vehicles from JSON exist in DB with owner and phone
  console.log('\nSample Hardcoded Vehicles in DB:');
  const sampleQuery = `
    SELECT v.id AS vehicle_id, v.plate_number, v.vehicle_type, u.id AS owner_id, u.name AS owner_name, u.email, u.phone
    FROM vehicles v
    JOIN users u ON v.owner_id = u.id
    ORDER BY v.id DESC
    LIMIT 10
  `;
  const sampleRes = await client.query(sampleQuery);
  console.table(sampleRes.rows);

  await client.end();
}

seedHardcodedVehicles().catch((err) => {
  console.error('Error seeding hardcoded vehicles:', err);
  process.exit(1);
});
