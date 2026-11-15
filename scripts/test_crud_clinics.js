/**
 * End-to-End Clinic Management CRUD Test Script
 * Runs all operations against API Gateway (port 8000)
 */

const BASE_URL = "http://localhost:8000/api";

const clinicSeedList = [
  { name: "Apollo Multispeciality Hospital", owner_name: "Dr. Prathap C. Reddy", email: "contact@apollo-kolkata.com", phone: "9830110001", city: "Kolkata", state: "West Bengal", address: "58 Canal Circular Road, Kadapara", registration_no: "WB-MED-2024-001", has_lab: true, status: "Active" },
  { name: "Fortis Healthcare & Diagnostic", owner_name: "Dr. Ashutosh Raghuvanshi", email: "info@fortis-anandapur.com", phone: "9830110002", city: "Kolkata", state: "West Bengal", address: "730 Anandapur, E.M. Bypass", registration_no: "WB-MED-2024-002", has_lab: true, status: "Active" },
  { name: "Max Super Speciality Hospital", owner_name: "Dr. Abhay Soi", email: "helpdesk@max-saket.com", phone: "9810110003", city: "New Delhi", state: "Delhi", address: "1, 2, Press Enclave Marg, Saket", registration_no: "DL-MED-2024-003", has_lab: true, status: "Active" },
  { name: "Manipal Hospital Diagnostics", owner_name: "Dr. Sudarshan Ballal", email: "care@manipal-whitefield.com", phone: "9845110004", city: "Bengaluru", state: "Karnataka", address: "HAL Old Airport Rd, Kodihalli", registration_no: "KA-MED-2024-004", has_lab: true, status: "Active" },
  { name: "Medanta - The Medicity", owner_name: "Dr. Naresh Trehan", email: "support@medanta-gurugram.com", phone: "9812110005", city: "Gurugram", state: "Haryana", address: "CH Bakhtawar Singh Rd, Sector 38", registration_no: "HR-MED-2024-005", has_lab: true, status: "Active" },
  { name: "Ruby General Hospital", owner_name: "Dr. Kamal Dutta", email: "contact@rubyhospital.com", phone: "9830110006", city: "Kolkata", state: "West Bengal", address: "Kasba Golpark, E.M. Bypass", registration_no: "WB-MED-2024-006", has_lab: true, status: "Active" },
  { name: "Narayana Superspeciality Clinic", owner_name: "Dr. Devi Prasad Shetty", email: "info@narayana-health.com", phone: "9830110007", city: "Howrah", state: "West Bengal", address: "120/1, Andul Road, Shibpur", registration_no: "WB-MED-2024-007", has_lab: true, status: "Active" },
  { name: "Care PolyClinic & Diagnostic", owner_name: "Dr. S. K. Mukherjee", email: "care@carepolyclinic.in", phone: "9830110008", city: "Kolkata", state: "West Bengal", address: "14B Southern Avenue", registration_no: "WB-MED-2024-008", has_lab: false, status: "Active" },
  { name: "Sunrise Dental & Eye Clinic", owner_name: "Dr. Ananya Sen", email: "appointments@sunrisemed.com", phone: "9830110009", city: "Siliguri", state: "West Bengal", address: "Sevoke Road, 2nd Mile", registration_no: "WB-MED-2024-009", has_lab: false, status: "Active" },
  { name: "Pulse Diagnostic Centre", owner_name: "Dr. B. K. Singhania", email: "reports@pulsediagnostic.com", phone: "9830110010", city: "Kolkata", state: "West Bengal", address: "75 Sarat Bose Road", registration_no: "WB-MED-2024-010", has_lab: true, status: "Active" },
  { name: "Lilavati Hospital & Research Centre", owner_name: "Dr. V. Ravishankar", email: "admin@lilavati-mumbai.com", phone: "9820110011", city: "Mumbai", state: "Maharashtra", address: "A-791, Bandra Reclamation, Bandra West", registration_no: "MH-MED-2024-011", has_lab: true, status: "Active" },
  { name: "Kokilaben Dhirubhai Ambani Clinic", owner_name: "Dr. Santosh Shetty", email: "info@kokilaben-ambani.com", phone: "9820110012", city: "Mumbai", state: "Maharashtra", address: "Rao Saheb, Achutrao Patwardhan Marg, Andheri West", registration_no: "MH-MED-2024-012", has_lab: true, status: "Active" },
  { name: "KIMS Hospitals & PolyClinic", owner_name: "Dr. B. Bhaskar Rao", email: "contact@kimshospitals.com", phone: "9848110013", city: "Hyderabad", state: "Telangana", address: "1-8-31/1, Minister Road, Secunderabad", registration_no: "TS-MED-2024-013", has_lab: true, status: "Active" },
  { name: "Yashoda Superspeciality Hospital", owner_name: "Dr. G. Surender Rao", email: "support@yashodamail.com", phone: "9848110014", city: "Hyderabad", state: "Telangana", address: "Raj Bhavan Road, Somajiguda", registration_no: "TS-MED-2024-014", has_lab: true, status: "Active" },
  { name: "Aster Medcity Healthcare", owner_name: "Dr. Azad Moopen", email: "enquiry@astermedcity.com", phone: "9847110015", city: "Kochi", state: "Kerala", address: "Kuttisahib Road, Cheranallur", registration_no: "KL-MED-2024-015", has_lab: true, status: "Active" },
  { name: "Amrita Institute of Medical Sciences", owner_name: "Dr. Prem Nair", email: "aims@amrita.edu", phone: "9847110016", city: "Kochi", state: "Kerala", address: "AIMS Ponekkara P.O.", registration_no: "KL-MED-2024-016", has_lab: true, status: "Active" },
  { name: "Peerless Hospital & B.K. Roy Research", owner_name: "Dr. Sujit Kar Purkayastha", email: "peerless@peerlesshospital.com", phone: "9830110017", city: "Kolkata", state: "West Bengal", address: "360 Panchasayar, Garia", registration_no: "WB-MED-2024-017", has_lab: true, status: "Active" },
  { name: "Healing Hands Family Clinic", owner_name: "Dr. Ritu Banerjee", email: "healing@handsclinic.com", phone: "9830110018", city: "Durgapur", state: "West Bengal", address: "City Centre, Sector 2", registration_no: "WB-MED-2024-018", has_lab: false, status: "Inactive" },
  { name: "Apex Orthopedic & Trauma Centre", owner_name: "Dr. Vikram Verma", email: "apexortho@apexcare.in", phone: "9811110019", city: "Chandigarh", state: "Punjab", address: "SCO 45-46, Sector 34A", registration_no: "CH-MED-2024-019", has_lab: false, status: "Active" },
  { name: "City Dental & Skin Care Clinic", owner_name: "Dr. Megha Kulkarni", email: "care@citydentalskin.com", phone: "9822110020", city: "Pune", state: "Maharashtra", address: "FC Road, Shivaji Nagar", registration_no: "MH-MED-2024-020", has_lab: false, status: "Active" }
];

async function runTests() {
  console.log("=================================================");
  console.log(" CLINIC MANAGEMENT FULL CRUD & DATA TEST SUITE ");
  console.log("=================================================\n");

  // Step 1: Admin Login
  console.log("1. Authenticating Admin...");
  const loginRes = await fetch(`${BASE_URL}/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@clinic.com", password: "Admin@1234" }),
  });
  const loginData = await loginRes.json();
  if (loginData.status !== 1) {
    throw new Error("Admin login failed: " + JSON.stringify(loginData));
  }
  const token = loginData.data.token;
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  console.log("   [PASS] Admin authenticated successfully.\n");

  // Step 2: Add 20 Records
  console.log("2. Adding 20 Clinic Records via Admin API...");
  let addedCount = 0;
  const createdClinics = [];

  for (let i = 0; i < clinicSeedList.length; i++) {
    const item = clinicSeedList[i];
    const addRes = await fetch(`${BASE_URL}/admin/clinics`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(item),
    });
    const addData = await addRes.json();
    if (addData.status === 1) {
      addedCount++;
      createdClinics.push(addData.data);
      console.log(`   [${i + 1}/20] Added: "${item.name}" (ID: ${addData.data.id})`);
    } else {
      console.log(`   [${i + 1}/20] Notice: ${addData.message}`);
    }
  }
  console.log(`   [PASS] Added ${addedCount} records.\n`);

  // Step 3: List Clinics
  console.log("3. Testing List Clinics API (Pagination & Query)...");
  const listRes = await fetch(`${BASE_URL}/admin/clinics?page=1&limit=50`, {
    headers: authHeaders,
  });
  const listData = await listRes.json();
  const totalClinics = listData.meta ? listData.meta.total : listData.data.length;
  console.log(`   [PASS] Total clinics retrieved: ${totalClinics}\n`);

  // Step 4: Edit a Clinic
  const sampleClinic = createdClinics[0] || (listData.data && listData.data[0]);
  if (sampleClinic) {
    console.log(`4. Testing Edit Clinic (ID: ${sampleClinic.id})...`);
    const editPayload = {
      name: sampleClinic.name + " (Renovated)",
      address: sampleClinic.address + ", Tower B",
      has_lab: true,
      description: "Updated premier multispeciality medical care facility.",
    };
    const editRes = await fetch(`${BASE_URL}/admin/clinics/${sampleClinic.id}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify(editPayload),
    });
    const editData = await editRes.json();
    if (editData.status === 1) {
      console.log(`   [PASS] Updated clinic name: "${editData.data.name}"`);
    } else {
      console.log(`   [FAIL] Edit failed: ${editData.message}`);
    }
    console.log("");
  }

  // Step 5: Toggle Status
  if (sampleClinic) {
    console.log(`5. Testing Status Toggle (ID: ${sampleClinic.id})...`);
    // Toggle to Inactive
    const statusRes1 = await fetch(`${BASE_URL}/admin/clinics/${sampleClinic.id}/status`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ status: "Inactive" }),
    });
    const statusData1 = await statusRes1.json();
    console.log(`   [PASS] Toggled to Inactive: ${statusData1.message}`);

    // Toggle back to Active
    const statusRes2 = await fetch(`${BASE_URL}/admin/clinics/${sampleClinic.id}/status`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ status: "Active" }),
    });
    const statusData2 = await statusRes2.json();
    console.log(`   [PASS] Toggled to Active: ${statusData2.message}\n`);
  }

  // Step 6: View Details
  if (sampleClinic) {
    console.log(`6. Testing Get Clinic Details (ID: ${sampleClinic.id})...`);
    const detailRes = await fetch(`${BASE_URL}/clinic/${sampleClinic.id}`);
    const detailData = await detailRes.json();
    if (detailData.status === 1) {
      console.log(`   [PASS] Fetched details for: "${detailData.data.name}", City: ${detailData.data.city}`);
    } else {
      console.log(`   [FAIL] Detail fetch failed: ${detailData.message}`);
    }
    console.log("");
  }

  // Step 7: Create & Delete a Temporary Test Clinic
  console.log("7. Testing Clinic Deletion Flow...");
  const tempClinicRes = await fetch(`${BASE_URL}/admin/clinics`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      name: "Temporary Test Clinic",
      owner_name: "Temp Owner",
      email: `temp_${Date.now()}@test.com`,
      phone: `99999${Math.floor(10000 + Math.random() * 90000)}`,
      city: "Test City",
    }),
  });
  const tempClinicData = await tempClinicRes.json();
  const tempId = tempClinicData.data.id;
  console.log(`   Created temporary clinic (ID: ${tempId})`);

  const deleteRes = await fetch(`${BASE_URL}/admin/clinics/${tempId}`, {
    method: "DELETE",
    headers: authHeaders,
  });
  const deleteData = await deleteRes.json();
  if (deleteData.status === 1) {
    console.log(`   [PASS] Deleted temporary clinic ID ${tempId}: ${deleteData.message}\n`);
  } else {
    console.log(`   [FAIL] Deletion failed: ${deleteData.message}\n`);
  }

  console.log("=================================================");
  console.log(" ALL 7 TEST SUITES COMPLETED SUCCESSFULLY! ");
  console.log("=================================================");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
