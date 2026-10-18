require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env")
});
const bcrypt = require("bcryptjs");
const db = require("../common/models");

const runSeed = async () => {
  try {
    await db.sequelize.authenticate();
    console.log("✅ DB connected successfully");

    // 1. Ensure Patients exist in existing Patient table
    const defaultPassword = await bcrypt.hash("Patient@123", 10);
    const patientData = [
      { name: "Rahul Mukherjee", email: "rahul.mukh@gmail.com", phone: "9830112233", gender: "Male", dob: "1988-04-12", blood_group: "B+", city: "Kolkata", state: "West Bengal" },
      { name: "Ananya Chatterjee", email: "ananya.c@gmail.com", phone: "9830223344", gender: "Female", dob: "1994-09-22", blood_group: "O+", city: "Kolkata", state: "West Bengal" },
      { name: "Sourav Banerjee", email: "sourav.b@gmail.com", phone: "9830334455", gender: "Male", dob: "1985-11-05", blood_group: "A+", city: "Howrah", state: "West Bengal" },
      { name: "Priyanka Sen", email: "priyanka.sen@gmail.com", phone: "9830445566", gender: "Female", dob: "1991-03-18", blood_group: "AB+", city: "Kolkata", state: "West Bengal" },
      { name: "Debashis Roy", email: "debashis.roy@gmail.com", phone: "9830556677", gender: "Male", dob: "1978-07-30", blood_group: "O-", city: "Kolkata", state: "West Bengal" },
      { name: "Sneha Ghosh", email: "sneha.ghosh@gmail.com", phone: "9830667788", gender: "Female", dob: "1996-12-14", blood_group: "B-", city: "Siliguri", state: "West Bengal" },
      { name: "Amitabh Bhattacharya", email: "amitabh.b@gmail.com", phone: "9830778899", gender: "Male", dob: "1965-02-28", blood_group: "A-", city: "Kolkata", state: "West Bengal" },
      { name: "Rituja Chakraborty", email: "rituja.c@gmail.com", phone: "9830889900", gender: "Female", dob: "1999-06-19", blood_group: "B+", city: "Durgapur", state: "West Bengal" },
      { name: "Vikram Malhotra", email: "vikram.m@gmail.com", phone: "9811223344", gender: "Male", dob: "1982-08-15", blood_group: "O+", city: "New Delhi", state: "Delhi" },
      { name: "Sunita Deshmukh", email: "sunita.d@gmail.com", phone: "9822334455", gender: "Female", dob: "1989-10-10", blood_group: "A+", city: "Mumbai", state: "Maharashtra" },
      { name: "Karthik Reddy", email: "karthik.r@gmail.com", phone: "9844556677", gender: "Male", dob: "1993-01-25", blood_group: "B+", city: "Hyderabad", state: "Telangana" },
      { name: "Meera Nair", email: "meera.n@gmail.com", phone: "9855667788", gender: "Female", dob: "1990-05-14", blood_group: "AB-", city: "Kochi", state: "Kerala" }
    ];

    const insertedPatients = [];
    for (const p of patientData) {
      let [patient] = await db.Patient.findOrCreate({
        where: { email: p.email },
        defaults: { ...p, password: defaultPassword, status: "Active" }
      });
      insertedPatients.push(patient);
    }
    console.log(`✅ Ensured ${insertedPatients.length} patient records`);

    // 2. Fetch Clinics
    const clinics = await db.Clinic.findAll({ order: [["id", "ASC"]] });
    if (clinics.length === 0) {
      console.log("No clinics found to seed.");
      process.exit(0);
    }

    const doctorTemplates = [
      { name: "Dr. Amit Sen", specialization: "Cardiologist", qualification: "MBBS, MD (Cardiology), DM", experience: 14, fee: 900, about: "Senior Interventional Cardiologist with extensive clinical expertise in coronary interventions." },
      { name: "Dr. Sunrita Das", specialization: "Dermatologist", qualification: "MBBS, MD (Dermatology), DNB", experience: 9, fee: 700, about: "Expert in clinical dermatology, laser aesthetics, and pediatric skin conditions." },
      { name: "Dr. Debopriya Roy", specialization: "Orthopedic Surgeon", qualification: "MBBS, MS (Orthopedics), MCh", experience: 16, fee: 1000, about: "Specialist in joint replacement surgeries, arthroscopy, and sports trauma." },
      { name: "Dr. Anirban Mukherjee", specialization: "Neurologist", qualification: "MBBS, MD, DM (Neurology)", experience: 12, fee: 1100, about: "Renowned Neurologist managing stroke, epilepsy, and neurodegenerative disorders." },
      { name: "Dr. Moumita Dutta", specialization: "Gynecologist & Obstetrician", qualification: "MBBS, MS (O&G), DGO", experience: 11, fee: 800, about: "Consultant Gynecologist specializing in high-risk pregnancy and laparoscopic surgeries." },
      { name: "Dr. Subhashis Paul", specialization: "Pediatrician", qualification: "MBBS, MD (Pediatrics)", experience: 8, fee: 600, about: "Dedicated child health specialist providing newborn care, vaccination, and growth monitoring." },
      { name: "Dr. Tanmoy Ganguly", specialization: "General Physician", qualification: "MBBS, MD (Internal Medicine)", experience: 15, fee: 500, about: "Experienced Consultant in lifestyle disorders, diabetes management, and geriatric care." },
      { name: "Dr. Rina Sengupta", specialization: "Endocrinologist", qualification: "MBBS, MD, DM (Endocrinology)", experience: 10, fee: 850, about: "Specialist in thyroid disorders, gestational diabetes, and hormonal imbalances." }
    ];

    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const todayDayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());

    for (const clinic of clinics.slice(0, 6)) {
      console.log(`\n🌱 Seeding Clinic ID ${clinic.id}: ${clinic.name}`);

      // Insert Doctors
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
            status: i === 7 ? "Inactive" : "Active"
          }
        });
        clinicDoctors.push(doc);
      }
      console.log(`✅ Ensured ${clinicDoctors.length} doctors for clinic ${clinic.id}`);

      // Insert Schedules
      const existingSchedules = await db.DoctorSchedule.count({
        where: { doctor_id: clinicDoctors.map(d => d.id) }
      });

      if (existingSchedules === 0) {
        for (let dIdx = 0; dIdx < clinicDoctors.length; dIdx++) {
          const doc = clinicDoctors[dIdx];
          if (doc.status !== "Active") continue;

          const scheduleSlots = [];

          // Schedule for today
          if (dIdx < 5) {
            scheduleSlots.push({
              doctor_id: doc.id,
              day: todayDayName,
              start_time: dIdx % 2 === 0 ? "09:00:00" : "17:00:00",
              end_time: dIdx % 2 === 0 ? "13:00:00" : "21:00:00",
              slot_duration: 15,
              is_available: true
            });

            if (dIdx === 0) {
              scheduleSlots.push({
                doctor_id: doc.id,
                day: todayDayName,
                start_time: "15:00:00",
                end_time: "19:00:00",
                slot_duration: 20,
                is_available: true
              });
            }
          }

          // Other days
          const extraDays = daysOfWeek.filter(day => day !== todayDayName);
          for (let k = 0; k < extraDays.length; k++) {
            if ((dIdx + k) % 2 === 0) {
              scheduleSlots.push({
                doctor_id: doc.id,
                day: extraDays[k],
                start_time: k % 2 === 0 ? "10:00:00" : "16:00:00",
                end_time: k % 2 === 0 ? "14:00:00" : "20:00:00",
                slot_duration: 15,
                is_available: true
              });
            }
          }

          await db.DoctorSchedule.bulkCreate(scheduleSlots);
        }
      }

      // Update Enquiries to have balanced statuses: Pending, Answered, Closed
      const existingEnquiries = await db.Enquiry.findAll({ where: { clinic_id: clinic.id } });
      if (existingEnquiries.length > 0) {
        const statuses = ["Pending", "Answered", "Closed"];
        for (let idx = 0; idx < existingEnquiries.length; idx++) {
          const assignedStatus = statuses[idx % statuses.length];
          await existingEnquiries[idx].update({
            status: assignedStatus,
            reply: assignedStatus !== "Pending" ? "Clinic replied to the patient enquiry." : null
          });
        }
        console.log(`✅ Updated ${existingEnquiries.length} enquiries to standard enum statuses`);
      }
    }

    console.log("\n✨ Database seed verified using existing models!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
};

runSeed();
