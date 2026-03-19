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
      `/api/compliance/shipments/39/documents`,
      `/api/compliance/shipment/39/summary`
    ];

    for (const url of endpoints) {
      console.log(`Testing ${url}...`);
      try {
        const res = await axios.get(`${BASE_URL}${url}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`   [${res.status}] SUCCESS`);
      } catch (err) {
        console.log(`   [${err.response?.status || 'ERROR'}] FAILED: ${err.response?.data?.detail || ''}`);
      }
    }

  } catch (err) {
    console.error("GLOBAL ERROR:", err.message);
  }
}

testAsAdmin();
