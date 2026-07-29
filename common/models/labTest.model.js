/**
 * LabTest Model
 * A catalogue of diagnostic tests offered by a clinic's lab.
 * Only clinics with has_lab = true should have lab tests.
 *
 * Table: lab_tests
 */
module.exports = (sequelize, DataTypes) => {
  const LabTest = sequelize.define(
    "LabTest",
    {
      id: {
        type:          DataTypes.BIGINT.UNSIGNED,
        primaryKey:    true,
        autoIncrement: true
      },
      clinic_id: {
        type:      DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        comment:   "FK → clinics.id — the lab this test belongs to"
      },
      test_name: {
        type:      DataTypes.STRING(150),
        allowNull: false,
        comment:   "Name of the diagnostic test e.g. CBC, LFT, HbA1c"
      },
      description: {
        type:    DataTypes.TEXT,
        comment: "Details about what the test checks, preparation instructions, etc."
      },
      price: {
        type:    DataTypes.DECIMAL(10, 2),
        comment: "Cost of the test in default currency"
      },
      report_duration: {
        type:    DataTypes.STRING(100),
        comment: "Estimated time to receive results e.g. '24 hours', '2–3 days'"
      },
      status: {
        type:         DataTypes.ENUM("Active","Inactive"),
        defaultValue: "Active"
      }
    },
    {
      tableName:  "lab_tests",
      timestamps: true,
      createdAt:  "created_at",
      updatedAt:  "updated_at"
    }
  );

  LabTest.associate = (db) => {
    LabTest.belongsTo(db.Clinic,     { foreignKey: "clinic_id",   as: "clinic"   });
    LabTest.hasMany(db.TestBooking,  { foreignKey: "lab_test_id", as: "bookings" });
  };

  return LabTest;
};
