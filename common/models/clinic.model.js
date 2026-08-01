/**
 * Clinic Model
 * Represents a registered clinic / hospital on the platform.
 * A clinic can have multiple Doctors and Lab Tests.
 *
 * Table: clinics
 */
module.exports = (sequelize, DataTypes) => {
  const Clinic = sequelize.define(
    "Clinic",
    {
      id: {
        type:          DataTypes.BIGINT.UNSIGNED,
        primaryKey:    true,
        autoIncrement: true
      },
      name: {
        type:      DataTypes.STRING(150),
        allowNull: false,
        comment:   "Official clinic / hospital name"
      },
      owner_name: {
        type:      DataTypes.STRING(100),
        allowNull: false,
        comment:   "Name of the primary owner / manager"
      },
      email: {
        type:      DataTypes.STRING(150),
        allowNull: false,
        unique:    true,
        comment:   "Login email used by the clinic admin"
      },
      phone: {
        type:    DataTypes.STRING(20),
        comment: "Primary contact number"
      },
      password: {
        type:      DataTypes.STRING(255),
        allowNull: false,
        comment:   "Bcrypt-hashed password"
      },
      token: {
        type:    DataTypes.TEXT,
        comment: "Active JWT for single-session enforcement"
      },
      logo: {
        type:    DataTypes.STRING(255),
        comment: "Relative path to clinic logo image"
      },
      registration_no: {
        type:    DataTypes.STRING(100),
        comment: "Government / regulatory registration number"
      },
      address: {
        type:    DataTypes.TEXT,
        comment: "Full street address"
      },
      city: {
        type: DataTypes.STRING(100)
      },
      state: {
        type: DataTypes.STRING(100)
      },
      pincode: {
        type:    DataTypes.STRING(10),
        comment: "Postal / ZIP code"
      },
      country: {
        type: DataTypes.STRING(100)
      },
      latitude: {
        type:    DataTypes.DECIMAL(10, 8),
        comment: "GPS latitude for location-based search"
      },
      longitude: {
        type:    DataTypes.DECIMAL(11, 8),
        comment: "GPS longitude for location-based search"
      },
      description: {
        type:    DataTypes.TEXT,
        comment: "About / overview of the clinic"
      },
      has_lab: {
        type:         DataTypes.BOOLEAN,
        defaultValue: false,
        comment:      "Whether this clinic offers lab test services"
      },
      status: {
        type:         DataTypes.ENUM("Active", "Inactive"),
        defaultValue: "Active"
      }
    },
    {
      tableName:  "clinics",
      timestamps: true,
      createdAt:  "created_at",
      updatedAt:  "updated_at"
    }
  );

  Clinic.associate = (db) => {
    Clinic.hasMany(db.Doctor,      { foreignKey: "clinic_id", as: "doctors"       });
    Clinic.hasMany(db.LabTest,     { foreignKey: "clinic_id", as: "lab_tests"     });
    Clinic.hasMany(db.Appointment, { foreignKey: "clinic_id", as: "appointments"  });
    Clinic.hasMany(db.Enquiry,     { foreignKey: "clinic_id", as: "enquiries"     });
    Clinic.hasMany(db.CallLog,     { foreignKey: "clinic_id", as: "call_logs"     });
    Clinic.hasMany(db.ClinicReview,{ foreignKey: "clinic_id", as: "reviews"       });
    Clinic.hasMany(db.TestBooking, { foreignKey: "clinic_id", as: "test_bookings" });
  };

  return Clinic;
};
