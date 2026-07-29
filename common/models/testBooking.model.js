/**
 * TestBooking Model
 * A patient books a lab test at a specific date and time.
 *
 * Status lifecycle:
 *   Pending → Collected → Processing → Completed
 *   Pending → Cancelled
 *
 * Table: test_bookings
 */
module.exports = (sequelize, DataTypes) => {
  const TestBooking = sequelize.define(
    "TestBooking",
    {
      id: {
        type:          DataTypes.BIGINT.UNSIGNED,
        primaryKey:    true,
        autoIncrement: true
      },
      patient_id: {
        type:      DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        comment:   "FK → patients.id"
      },
      clinic_id: {
        type:      DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        comment:   "FK → clinics.id"
      },
      lab_test_id: {
        type:      DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        comment:   "FK → lab_tests.id"
      },
      booking_date: {
        type:      DataTypes.DATEONLY,
        allowNull: false,
        comment:   "Date sample will be collected (YYYY-MM-DD)"
      },
      booking_time: {
        type:      DataTypes.TIME,
        allowNull: false,
        comment:   "Time slot for sample collection (HH:MM:SS)"
      },
      status: {
        type:         DataTypes.ENUM("Pending","Collected","Processing","Completed","Cancelled"),
        defaultValue: "Pending"
      }
    },
    {
      tableName:  "test_bookings",
      timestamps: true,
      createdAt:  "created_at",
      updatedAt:  false
    }
  );

  TestBooking.associate = (db) => {
    TestBooking.belongsTo(db.Patient, { foreignKey: "patient_id",  as: "patient"  });
    TestBooking.belongsTo(db.Clinic,  { foreignKey: "clinic_id",   as: "clinic"   });
    TestBooking.belongsTo(db.LabTest, { foreignKey: "lab_test_id", as: "lab_test" });
    TestBooking.hasOne(db.LabReport,  { foreignKey: "booking_id",  as: "report"   });
  };

  return TestBooking;
};
