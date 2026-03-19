const axios = require('axios');

const BASE_URL = 'https://epa-backend-latest.onrender.com';

async function testAsAdmin() {
  try {
    console.log("1. Logging in as Admin...");
    let response = await axios.post(`${BASE_URL}/api/auth/login-json`, {
      email: "admin@epa.com",
      password: "Admin@2024!"
    });
    const token = response.data.access_token;
    console.log("   Success! Token received.\n");

    console.log("2. Fetching Clearance Activities as Admin...");
    console.log("   URL: /api/clearance-activities/api/clearance-activities");
    response = await axios.get(`${BASE_URL}/api/clearance-activities/api/clearance-activities`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("   Success! Received activities:");
    console.log(response.data.map(a => `- ${a.name} (Priority ${a.priority})`).join("\n"));

  } catch (err) {
    if (err.response) {
      console.error(`ERROR: Response ${err.response.status} from ${err.config.url}`);
    } else {
      console.error("ERROR:", err.message);
    }
  }
}

testAsAdmin();
