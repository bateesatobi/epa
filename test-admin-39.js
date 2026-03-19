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

    const endpoints = [
      `/api/shipments/39`,
      `/api/clients/39`,
      `/api/depots/39`,
      `/api/clearance-activities/api/clearance-activities/39`,
      `/api/users/39`
    ];

    for (const url of endpoints) {
      console.log(`Testing ${url}...`);
      try {
        const res = await axios.get(`${BASE_URL}${url}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`   [${res.status}] SUCCESS`);
      } catch (err) {
        console.log(`   [${err.response?.status || 'ERROR'}] FAILED`);
      }
    }

  } catch (err) {
    console.error("GLOBAL ERROR:", err.message);
  }
}

testAsAdmin();
