/**
 * Patient Model
 * Represents a registered patient / end-user of the mobile app.
 *
 * Table: patients
 */
module.exports = (sequelize, DataTypes) => {
  const Patient = sequelize.define(
    "Patient",
    {
      id: {
        type:          DataTypes.BIGINT.UNSIGNED,
        primaryKey:    true,
        autoIncrement: true
      },
      name: {
        type:      DataTypes.STRING(100),
        allowNull: false,
        comment:   "Full name of the patient"
      },
      email: {
        type:    DataTypes.STRING(150),
        unique:  true,
        comment: "Login / contact email"
      },
      phone: {
        type:    DataTypes.STRING(20),
        unique:  true,
        comment: "Mobile number (also used for login / OTP)"
      },
      password: {
        type:      DataTypes.STRING(255),
        allowNull: false,
        comment:   "Bcrypt-hashed password"
      },
      token: {
        type:    DataTypes.TEXT,
        comment: "Active JWT"
      },
      gender: {
        type:    DataTypes.ENUM("Male", "Female", "Other"),
        comment: "Biological gender"
      },
      dob: {
        type:    DataTypes.DATEONLY,
        comment: "Date of birth (YYYY-MM-DD)"
      },
      blood_group: {
        type:    DataTypes.STRING(5),
        comment: "ABO blood group e.g. A+, O-"
      },
      address: {
        type: DataTypes.TEXT
      },
      city: {
        type: DataTypes.STRING(100)
      },
      state: {
        type: DataTypes.STRING(100)
      },
      country: {
        type: DataTypes.STRING(100)
      },
      profile_image: {
        type:    DataTypes.STRING(255),
        comment: "Relative path to profile picture"
      },
      status: {
        type:         DataTypes.ENUM("Active", "Inactive"),
        defaultValue: "Active"
      }
    },
    {
      tableName:  "patients",
      timestamps: true,
      createdAt:  "created_at",
      updatedAt:  "updated_at"
    }
  );

  Patient.associate = (db) => {
    Patient.hasMany(db.Appointment,  { foreignKey: "patient_id", as: "appointments"  });
    Patient.hasMany(db.Enquiry,      { foreignKey: "patient_id", as: "enquiries"     });
    Patient.hasMany(db.CallLog,      { foreignKey: "patient_id", as: "call_logs"     });
    Patient.hasMany(db.TestBooking,  { foreignKey: "patient_id", as: "test_bookings" });
    Patient.hasMany(db.DoctorReview, { foreignKey: "patient_id", as: "doctor_reviews"});
    Patient.hasMany(db.ClinicReview, { foreignKey: "patient_id", as: "clinic_reviews"});
  };

  return Patient;
};
