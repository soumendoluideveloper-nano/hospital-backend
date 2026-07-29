/**
 * Doctor Model
 * A Doctor belongs to a specific Clinic.
 * Clinic admins create and manage doctor records.
 *
 * Table: doctors
 */
module.exports = (sequelize, DataTypes) => {
  const Doctor = sequelize.define(
    "Doctor",
    {
      id: {
        type:          DataTypes.BIGINT.UNSIGNED,
        primaryKey:    true,
        autoIncrement: true
      },
      clinic_id: {
        type:      DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        comment:   "FK → clinics.id"
      },
      name: {
        type:      DataTypes.STRING(100),
        allowNull: false,
        comment:   "Full name including title (e.g. Dr. John Smith)"
      },
      email: {
        type:    DataTypes.STRING(150),
        comment: "Doctor's contact email"
      },
      phone: {
        type:    DataTypes.STRING(20),
        comment: "Doctor's direct contact number"
      },
      specialization: {
        type:    DataTypes.STRING(150),
        comment: "Medical specialization e.g. Cardiology, Dermatology"
      },
      qualification: {
        type:    DataTypes.STRING(255),
        comment: "Degrees / certifications e.g. MBBS, MD"
      },
      experience: {
        type:         DataTypes.INTEGER,
        defaultValue: 0,
        comment:      "Years of professional experience"
      },
      consultation_fee: {
        type:    DataTypes.DECIMAL(10, 2),
        comment: "Per-session consultation fee in default currency"
      },
      profile_image: {
        type:    DataTypes.STRING(255),
        comment: "Relative path to doctor's profile picture"
      },
      about: {
        type:    DataTypes.TEXT,
        comment: "Bio / short description shown on the doctor profile page"
      },
      status: {
        type:         DataTypes.ENUM("Active", "Inactive"),
        defaultValue: "Active"
      }
    },
    {
      tableName:  "doctors",
      timestamps: true,
      createdAt:  "created_at",
      updatedAt:  "updated_at"
    }
  );

  Doctor.associate = (db) => {
    Doctor.belongsTo(db.Clinic,       { foreignKey: "clinic_id", as: "clinic"         });
    Doctor.hasMany(db.DoctorSchedule, { foreignKey: "doctor_id", as: "schedules"      });
    Doctor.hasMany(db.Appointment,    { foreignKey: "doctor_id", as: "appointments"   });
    Doctor.hasMany(db.Enquiry,        { foreignKey: "doctor_id", as: "enquiries"      });
    Doctor.hasMany(db.CallLog,        { foreignKey: "doctor_id", as: "call_logs"      });
    Doctor.hasMany(db.DoctorReview,   { foreignKey: "doctor_id", as: "reviews"        });
  };

  return Doctor;
};
