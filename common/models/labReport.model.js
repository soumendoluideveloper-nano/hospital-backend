/**
 * LabReport Model
 * Uploaded by the clinic lab once a test is processed.
 * One-to-one with TestBooking.
 *
 * Table: lab_reports
 */
module.exports = (sequelize, DataTypes) => {
  const LabReport = sequelize.define(
    "LabReport",
    {
      id: {
        type:          DataTypes.BIGINT.UNSIGNED,
        primaryKey:    true,
        autoIncrement: true
      },
      booking_id: {
        type:      DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        unique:    true,
        comment:   "FK → test_bookings.id (1:1 relationship)"
      },
      report_file: {
        type:    DataTypes.STRING(255),
        comment: "Relative path to the uploaded PDF / image report"
      },
      remarks: {
        type:    DataTypes.TEXT,
        comment: "Lab technician's remarks or interpretation notes"
      }
    },
    {
      tableName:  "lab_reports",
      timestamps: true,
      createdAt:  "uploaded_at",
      updatedAt:  false
    }
  );

  LabReport.associate = (db) => {
    LabReport.belongsTo(db.TestBooking, { foreignKey: "booking_id", as: "booking" });
  };

  return LabReport;
};
