require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env")
});
const bcrypt = require("bcryptjs");
const db = require("../common/models");

const seedRichData = async () => {
  try {
    await db.sequelize.authenticate();
    console.log("✅ DB connection verified successfully");

    // ==========================================
    // 1. SEED PATIENTS (15 Realistic Patients)
    // ==========================================
    const defaultPassword = await bcrypt.hash("Patient@123", 10);
    const patientMasterList = [
      { name: "Rahul Mukherjee", email: "rahul.mukh@gmail.com", phone: "9830112233", gender: "Male", dob: "1988-04-12", blood_group: "B+", address: "42 Park Street, Flat 4B", city: "Kolkata", state: "West Bengal" },
      { name: "Ananya Chatterjee", email: "ananya.c@gmail.com", phone: "9830223344", gender: "Female", dob: "1994-09-22", blood_group: "O+", address: "18/2 Gariahat Road", city: "Kolkata", state: "West Bengal" },
      { name: "Sourav Banerjee", email: "sourav.b@gmail.com", phone: "9830334455", gender: "Male", dob: "1985-11-05", blood_group: "A+", address: "55 Belur Math Road", city: "Howrah", state: "West Bengal" },
      { name: "Priyanka Sen", email: "priyanka.sen@gmail.com", phone: "9830445566", gender: "Female", dob: "1991-03-18", blood_group: "AB+", address: "78 Salt Lake Sector 1", city: "Kolkata", state: "West Bengal" },
      { name: "Debashis Roy", email: "debashis.roy@gmail.com", phone: "9830556677", gender: "Male", dob: "1978-07-30", blood_group: "O-", address: "102 Shyambazar Street", city: "Kolkata", state: "West Bengal" },
      { name: "Sneha Ghosh", email: "sneha.ghosh@gmail.com", phone: "9830667788", gender: "Female", dob: "1996-12-14", blood_group: "B-", address: "14 Hill Cart Road", city: "Siliguri", state: "West Bengal" },
      { name: "Amitabh Bhattacharya", email: "amitabh.b@gmail.com", phone: "9830778899", gender: "Male", dob: "1965-02-28", blood_group: "A-", address: "89 Southern Avenue", city: "Kolkata", state: "West Bengal" },
      { name: "Rituja Chakraborty", email: "rituja.c@gmail.com", phone: "9830889900", gender: "Female", dob: "1999-06-19", blood_group: "B+", address: "23 City Centre", city: "Durgapur", state: "West Bengal" },
      { name: "Vikram Malhotra", email: "vikram.m@gmail.com", phone: "9811223344", gender: "Male", dob: "1982-08-15", blood_group: "O+", address: "44 Defence Colony", city: "New Delhi", state: "Delhi" },
      { name: "Sunita Deshmukh", email: "sunita.d@gmail.com", phone: "9822334455", gender: "Female", dob: "1989-10-10", blood_group: "A+", address: "65 Andheri West", city: "Mumbai", state: "Maharashtra" },
      { name: "Karthik Reddy", email: "karthik.r@gmail.com", phone: "9844556677", gender: "Male", dob: "1993-01-25", blood_group: "B+", address: "12 Banjara Hills", city: "Hyderabad", state: "Telangana" },
      { name: "Meera Nair", email: "meera.n@gmail.com", phone: "9855667788", gender: "Female", dob: "1990-05-14", blood_group: "AB-", address: "88 Marine Drive", city: "Kochi", state: "Kerala" },
      { name: "Arjun Verma", email: "arjun.v@gmail.com", phone: "9866778899", gender: "Male", dob: "1986-06-20", blood_group: "O+", address: "33 Koramangala", city: "Bengaluru", state: "Karnataka" },
      { name: "Pooja Hegde", email: "pooja.h@gmail.com", phone: "9877889900", gender: "Female", dob: "1995-11-11", blood_group: "A+", address: "21 Indiranagar", city: "Bengaluru", state: "Karnataka" },
      { name: "Siddharth Roy", email: "siddharth.r@gmail.com", phone: "9888990011", gender: "Male", dob: "1992-03-03", blood_group: "B+", address: "77 Jodhpur Park", city: "Kolkata", state: "West Bengal" }
    ];

    const seededPatients = [];
    for (const p of patientMasterList) {
      let [patient] = await db.Patient.findOrCreate({
        where: { email: p.email },
        defaults: { ...p, password: defaultPassword, status: "Active" }
      });
      seededPatients.push(patient);
    }
    console.log(`✅ Ensured ${seededPatients.length} patient master records`);

    // ==========================================
    // 2. FETCH CLINICS
    // ==========================================
    const clinics = await db.Clinic.findAll({ order: [["id", "ASC"]] });
    if (clinics.length === 0) {
      console.log("❌ No clinics found. Please ensure clinics are registered in the DB.");
      process.exit(1);
    }
    console.log(`📋 Found ${clinics.length} clinics in the system`);

    // ==========================================
    // 3. DOCTOR TEMPLATES (10 Diverse Specialties)
    // ==========================================
    const doctorTemplates = [
      { name: "Dr. Amit Sen", specialization: "Cardiologist", qualification: "MBBS, MD (Cardiology), DM", experience: 14, fee: 900, about: "Senior Interventional Cardiologist with extensive clinical expertise in coronary interventions, hypertension, and arrhythmia management." },
      { name: "Dr. Sunrita Das", specialization: "Dermatologist", qualification: "MBBS, MD (Dermatology), DNB", experience: 9, fee: 700, about: "Expert in clinical dermatology, laser aesthetic treatments, eczema, psoriasis, and pediatric skin conditions." },
      { name: "Dr. Debopriya Roy", specialization: "Orthopedic Surgeon", qualification: "MBBS, MS (Orthopedics), MCh", experience: 16, fee: 1000, about: "Specialist in total knee/hip joint replacement surgeries, arthroscopic ligament reconstruction, and sports trauma." },
      { name: "Dr. Anirban Mukherjee", specialization: "Neurologist", qualification: "MBBS, MD, DM (Neurology)", experience: 12, fee: 1100, about: "Renowned Neurologist managing acute stroke, epilepsy syndromes, migraine, Parkinson's, and neuropathy." },
      { name: "Dr. Moumita Dutta", specialization: "Gynecologist & Obstetrician", qualification: "MBBS, MS (O&G), DGO", experience: 11, fee: 800, about: "Consultant Obstetrician & Gynecologist specializing in high-risk pregnancy, PCOS, infertility, and laparoscopic procedures." },
      { name: "Dr. Subhashis Paul", specialization: "Pediatrician", qualification: "MBBS, MD (Pediatrics)", experience: 8, fee: 600, about: "Dedicated child health specialist providing comprehensive newborn care, routine immunization, and growth monitoring." },
      { name: "Dr. Tanmoy Ganguly", specialization: "General Physician", qualification: "MBBS, MD (Internal Medicine)", experience: 15, fee: 500, about: "Senior Consultant Physician expert in lifestyle disorders, diabetes mellitus, hypertension, and geriatric medicine." },
      { name: "Dr. Rina Sengupta", specialization: "Endocrinologist", qualification: "MBBS, MD, DM (Endocrinology)", experience: 10, fee: 850, about: "Expert Endocrinologist treating thyroid disorders, gestational diabetes, obesity, metabolic bone disease, and hormonal imbalances." },
      { name: "Dr. Alok Banerjee", specialization: "ENT Specialist", qualification: "MBBS, MS (ENT), DLO", experience: 13, fee: 750, about: "Specialist in micro-ear surgeries, endoscopic sinus surgery, vertigo, tinnitus, and pediatric ENT conditions." },
      { name: "Dr. Sharmila Roy", specialization: "Ophthalmologist", qualification: "MBBS, MS (Ophthalmology)", experience: 14, fee: 800, about: "Senior Consultant Eye Surgeon specializing in Phaco cataract surgery, diabetic retinopathy, and glaucoma management." }
    ];

    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const todayDayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
    console.log(`📅 Current Day detected as: "${todayDayName}"`);

    // ==========================================
    // 4. SEED DATA FOR CLINICS (Top 6 Clinics)
    // ==========================================
    for (const clinic of clinics.slice(0, 6)) {
      console.log(`\n🏥 ----------------------------------------`);
      console.log(`🏥 Populating Data for Clinic ID ${clinic.id}: "${clinic.name}"`);
      console.log(`🏥 ----------------------------------------`);

      // A. DOCTORS
      const clinicDoctors = [];
      for (let i = 0; i < doctorTemplates.length; i++) {
        const tpl = doctorTemplates[i];
        const email = `dr.${tpl.name.toLowerCase().replace(/[^a-z]/g, "")}_c${clinic.id}@healthspot.com`;

        let [doc] = await db.Doctor.findOrCreate({
          where: { clinic_id: clinic.id, name: tpl.name },
          defaults: {
            clinic_id: clinic.id,
            name: tpl.name,
            email: email,
            phone: `9831${String(clinic.id).padStart(2, "0")}${String(i).padStart(2, "0")}11`,
            specialization: tpl.specialization,
            qualification: tpl.qualification,
            experience: tpl.experience,
            consultation_fee: tpl.fee,
            about: tpl.about,
            status: i >= 8 ? "Inactive" : "Active" // 8 Active, 2 Inactive
          }
        });
        clinicDoctors.push(doc);
      }
      console.log(`  👉 10 Doctors checked/seeded (8 Active, 2 Inactive)`);

      // B. DOCTOR SCHEDULES
      // Clear old schedules for clean, rich schedule setup
      await db.DoctorSchedule.destroy({
        where: { doctor_id: clinicDoctors.map(d => d.id) }
      });

      const newSchedules = [];

      for (let dIdx = 0; dIdx < clinicDoctors.length; dIdx++) {
        const doc = clinicDoctors[dIdx];
        if (doc.status !== "Active") continue;

        // 1. SCHEDULE FOR TODAY
        // Doctors 0, 1, 2, 3, 4, 5 will have active sessions TODAY
        if (dIdx <= 5) {
          // Morning / Afternoon session
          const startH = dIdx % 2 === 0 ? "09:00:00" : "16:00:00";
          const endH   = dIdx % 2 === 0 ? "13:00:00" : "20:00:00";
          newSchedules.push({
            doctor_id: doc.id,
            day: todayDayName,
            start_time: startH,
            end_time: endH,
            slot_duration: 15,
            is_available: true
          });

          // Doctor 0 and Doctor 2 get a SECOND SESSION today (demonstrating Unique Doctors vs Sessions)
          if (dIdx === 0) {
            newSchedules.push({
              doctor_id: doc.id,
              day: todayDayName,
              start_time: "17:00:00",
              end_time: "21:00:00",
              slot_duration: 20,
              is_available: true
            });
          }
          if (dIdx === 2) {
            newSchedules.push({
              doctor_id: doc.id,
              day: todayDayName,
              start_time: "14:00:00",
              end_time: "16:00:00",
              slot_duration: 15,
              is_available: true
            });
          }
        }

        // 2. SCHEDULES FOR ALL OTHER DAYS (Monday through Sunday)
        const otherDays = daysOfWeek.filter(d => d !== todayDayName);
        for (let k = 0; k < otherDays.length; k++) {
          const dayName = otherDays[k];
          // Distribute across days so every day has doctors
          if ((dIdx + k) % 2 === 0 || (dIdx + k) % 3 === 0) {
            newSchedules.push({
              doctor_id: doc.id,
              day: dayName,
              start_time: k % 2 === 0 ? "10:00:00" : "15:00:00",
              end_time: k % 2 === 0 ? "14:00:00" : "19:00:00",
              slot_duration: 15,
              is_available: true
            });
          }
        }
      }

      await db.DoctorSchedule.bulkCreate(newSchedules);
      console.log(`  👉 ${newSchedules.length} Doctor Schedule slots created across all 7 days`);

      // C. PATIENT ENQUIRIES (25 Enquiries per Clinic across dates)
      // Clear old enquiries for fresh distributed dataset
      await db.Enquiry.destroy({ where: { clinic_id: clinic.id } });

      const now = new Date();
      const sampleEnquiries = [
        // TODAY (Offset: 0 days)
        { offsetHours: 1,  status: "Pending",  msg: "I am feeling sudden chest tightness and fatigue after my morning walk. Can I consult Dr. Amit Sen today?" },
        { offsetHours: 2,  status: "Answered", msg: "Please confirm fasting blood sugar and HbA1c test reporting time." },
        { offsetHours: 4,  status: "Pending",  msg: "Need an urgent pediatric appointment for my 3-year-old having severe cough and mild fever." },
        { offsetHours: 6,  status: "Answered", msg: "Enquiry for knee pain consultation fee and slots for Dr. Debopriya Roy." },
        { offsetHours: 8,  status: "Pending",  msg: "Can I book a consultation with the Dermatologist for severe allergic rash?" },

        // YESTERDAY (Offset: 1 day)
        { offsetHours: 26, status: "Answered", msg: "Enquiry regarding MRI report evaluation and second opinion with Neurologist." },
        { offsetHours: 29, status: "Pending",  msg: "Is home blood sample collection available in Howrah / Salt Lake area?" },
        { offsetHours: 32, status: "Closed",   msg: "Requested copy of previous prescription and immunization chart." },
        { offsetHours: 35, status: "Answered", msg: "Routine antenatal checkup booking enquiry with Gynecologist Dr. Moumita Dutta." },

        // THIS WEEK (Offset: 2 to 6 days)
        { offsetHours: 50,  status: "Answered", msg: "Booking confirmed for thyroid panel checkup and diet consultation." },
        { offsetHours: 72,  status: "Closed",   msg: "Consultation query resolved via tele-guidance." },
        { offsetHours: 90,  status: "Answered", msg: "Enquiry for whole body preventive health checkup package details and pricing." },
        { offsetHours: 110, status: "Closed",   msg: "Follow-up consultation successfully completed." },
        { offsetHours: 130, status: "Pending",  msg: "Do you accept cashless Mediclaim TPA for day-care minor ENT procedures?" },

        // LAST WEEK (Offset: 8 to 14 days)
        { offsetHours: 180, status: "Closed",   msg: "Patient attended physical OPD consultation with Dr. Amit Sen." },
        { offsetHours: 200, status: "Answered", msg: "Post-surgery dressing change appointment confirmed." },
        { offsetHours: 230, status: "Closed",   msg: "Blood test reports collected from reception." },
        { offsetHours: 260, status: "Closed",   msg: "Routine pediatric immunization completed." },
        { offsetHours: 300, status: "Answered", msg: "Enquiry regarding Holter monitor installation timings." },

        // THIS MONTH / LAST MONTH (Offset: 16 to 28 days)
        { offsetHours: 380, status: "Closed",   msg: "Diabetes management routine checkup completed." },
        { offsetHours: 420, status: "Closed",   msg: "Dermatology follow-up review after 2 weeks medication." },
        { offsetHours: 480, status: "Closed",   msg: "Annual executive health checkup completed." },
        { offsetHours: 540, status: "Closed",   msg: "Physiotherapy session schedule confirmed." },
        { offsetHours: 600, status: "Closed",   msg: "Eye checkup and prescription glasses power test done." },
        { offsetHours: 660, status: "Closed",   msg: "General physician health clearance certificate issued." }
      ];

      const enquiryRecords = [];
      for (let eIdx = 0; eIdx < sampleEnquiries.length; eIdx++) {
        const item = sampleEnquiries[eIdx];
        const pat = seededPatients[eIdx % seededPatients.length];
        const doc = clinicDoctors[eIdx % clinicDoctors.length];
        const createdAtDate = new Date(now.getTime() - item.offsetHours * 60 * 60 * 1000);

        enquiryRecords.push({
          patient_id: pat.id,
          clinic_id: clinic.id,
          doctor_id: doc.id,
          message: item.msg,
          reply: item.status === "Answered" || item.status === "Closed"
            ? "Our clinic care executive attended the enquiry and provided required guidance and booking details."
            : null,
          status: item.status,
          created_at: createdAtDate
        });
      }

      await db.Enquiry.bulkCreate(enquiryRecords);
      console.log(`  👉 ${enquiryRecords.length} Patient Enquiries populated (distributed across Today, Week, Month)`);

      // D. CALL LOGS (10 Call Logs per Clinic)
      await db.CallLog.destroy({ where: { clinic_id: clinic.id } });
      const callLogRecords = [];
      for (let cIdx = 0; cIdx < 10; cIdx++) {
        const pat = seededPatients[cIdx % seededPatients.length];
        const doc = clinicDoctors[cIdx % clinicDoctors.length];
        const createdAtDate = new Date(now.getTime() - (cIdx * 7 + 2) * 60 * 60 * 1000);

        callLogRecords.push({
          patient_id: pat.id,
          clinic_id: clinic.id,
          doctor_id: doc.id,
          call_type: cIdx % 2 === 0 ? "Audio" : "Video",
          duration: (cIdx + 1) * 90,
          status: cIdx % 4 === 0 ? "Missed" : "Completed",
          created_at: createdAtDate
        });
      }
      await db.CallLog.bulkCreate(callLogRecords);
      console.log(`  👉 ${callLogRecords.length} Call Logs created`);

      // E. CLINIC REVIEWS (8 Reviews per Clinic)
      await db.ClinicReview.destroy({ where: { clinic_id: clinic.id } });
      const reviews = [
        { rating: 5, review: "Excellent clinic infrastructure, prompt OPD service, and very clean waiting area." },
        { rating: 5, review: "Doctors are very cooperative and staff guided us thoroughly for lab investigations." },
        { rating: 4, review: "Very good experience. Highly recommend Dr. Amit Sen and Dr. Debopriya Roy." },
        { rating: 5, review: "Smooth consultation and quick billing counter experience." },
        { rating: 4, review: "Convenient location and polite customer care reception team." },
        { rating: 5, review: "Clean diagnostic facilities and accurate timely blood test reports." },
        { rating: 4, review: "Well maintained clinic with experienced specialists." },
        { rating: 5, review: "Top notch healthcare service in the city." }
      ];

      const reviewRecords = [];
      for (let rIdx = 0; rIdx < reviews.length; rIdx++) {
        const pat = seededPatients[rIdx % seededPatients.length];
        const createdAtDate = new Date(now.getTime() - (rIdx * 18 + 4) * 60 * 60 * 1000);

        reviewRecords.push({
          clinic_id: clinic.id,
          patient_id: pat.id,
          rating: reviews[rIdx].rating,
          review: reviews[rIdx].review,
          created_at: createdAtDate
        });
      }
      await db.ClinicReview.bulkCreate(reviewRecords);
      console.log(`  👉 ${reviewRecords.length} Clinic Patient Reviews created`);
    }

    console.log(`\n🎉 =========================================================`);
    console.log(`🎉 ALL DUMMY RECORDS SUCCESSFULLY STORED IN DATABASE!`);
    console.log(`🎉 Open Clinic Details & Activity Dashboard to view live records!`);
    console.log(`🎉 =========================================================\n`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeder execution error:", err);
    process.exit(1);
  }
};

seedRichData();
