import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cities_of_future',
});

const DUMMY_NAMES = [
  'Vikram Malhotra',
  'Pooja Hegde',
  'Ramesh Kumar',
  'Ananya Iyer',
  'Rohit Sharma',
  'Sneha Deshmukh',
  'Arjun Patel',
  'Meera Nair',
  'Kiran Kulkarni',
  'Sunita Verma',
  'Aditya Rao',
  'Deepa Shenoy',
  'Gautam Menon',
  'Radhika Nair',
  'Siddharth Joshi',
  'Bhavna Mehta',
  'Kunal Roy',
  'Tanvi Sawant',
  'Naveen Prasad',
  'Shalini Reddy',
];

async function seed() {
  const jsonPath = path.resolve(__dirname, '../detected_vehicles.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`File ${jsonPath} does not exist yet.`);
    await pool.end();
    return;
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const vehiclesList = JSON.parse(raw);
  console.log(`Read ${vehiclesList.length} detected vehicles from JSON.`);

  // 1. Ensure at least one Camera exists
  let camRes = await pool.query("SELECT id FROM cameras WHERE id = 'CAM_01'");
  if (camRes.rows.length === 0) {
    await pool.query(
      "INSERT INTO cameras (id, name, latitude, longitude, speed_limit, status) VALUES ('CAM_01', 'Smart Junction Alpha CCTV', 12.9716, 77.5946, 60, 'ACTIVE')"
    );
    console.log("Created default camera 'CAM_01'");
  }

  // 2. Ensure at least one Simulation exists
  let simRes = await pool.query("SELECT id FROM simulations ORDER BY id LIMIT 1");
  let simId = simRes.rows[0]?.id;
  if (!simId) {
    const s = await pool.query(
      "INSERT INTO simulations (name, status, started_at) VALUES ('Navanagar CCTV Traffic Surveillance', 'RUNNING', NOW()) RETURNING id"
    );
    simId = s.rows[0].id;
    console.log(`Created default simulation #${simId}`);
  }

  // 3. Register the 3 CCTV videos in video_files
  const cctvVideos = [
    { name: 'Helmet Detection (online-video-cutter.com).mp4', key: 'videos/Helmet Detection (online-video-cutter.com).mp4' },
    { name: 'Licence Plate Camera Illustration Video (online-video-cutter.com).mp4', key: 'videos/Licence Plate Camera Illustration Video (online-video-cutter.com).mp4' },
    { name: 'sample_cctv_traffic.mp4', key: 'videos/sample_cctv_traffic.mp4' },
  ];

  for (const cv of cctvVideos) {
    const checkV = await pool.query('SELECT id FROM video_files WHERE r2_key = $1', [cv.key]);
    if (checkV.rows.length === 0) {
      await pool.query(
        'INSERT INTO video_files (camera_id, simulation_id, file_name, r2_key, status) VALUES ($1, $2, $3, $4, $5)',
        ['CAM_01', simId, cv.name, cv.key, 'UPLOADED']
      );
      console.log(`Registered CCTV video '${cv.name}' in video_files.`);
    }
  }

  // 4. Seed Users and Vehicles
  let insertedCount = 0;
  for (let i = 0; i < vehiclesList.length; i++) {
    const v = vehiclesList[i];
    const plate = (v.plate_number || '').trim().toUpperCase();
    if (!plate) continue;

    // Check if vehicle already exists
    const existingVeh = await pool.query('SELECT id FROM vehicles WHERE plate_number = $1', [plate]);
    if (existingVeh.rows.length > 0) {
      continue;
    }

    // Pick owner name and dummy phone number
    const ownerName = DUMMY_NAMES[i % DUMMY_NAMES.length];
    const dummyPhone = `+91 98${String(10000000 + i).slice(-8)}`;
    const email = `owner_${plate.toLowerCase().replace(/[^a-z0-9]/g, '')}@navanagar.gov.in`;

    // Check or create user
    let userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    let userId = userRes.rows[0]?.id;

    if (!userId) {
      const uIns = await pool.query(
        "INSERT INTO users (name, email, password_hash, phone, role, status) VALUES ($1, $2, $3, $4, 'CITIZEN', 'ACTIVE') RETURNING id",
        [ownerName, email, '$2a$10$dummyHashNotForDirectLoginXXXXXXXXXX', dummyPhone]
      );
      userId = uIns.rows[0].id;
    }

    const vehType = v.helmet_status !== 'unknown' ? 'MOTORCYCLE' : 'CAR';

    await pool.query(
      'INSERT INTO vehicles (plate_number, owner_id, vehicle_type) VALUES ($1, $2, $3)',
      [plate, userId, vehType]
    );
    insertedCount++;
    console.log(`Registered Vehicle: '${plate}' -> Owner: ${ownerName} (${dummyPhone})`);
  }

  console.log(`\nSuccessfully seeded ${insertedCount} new vehicles and owners into PostgreSQL.`);
  await pool.end();
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
