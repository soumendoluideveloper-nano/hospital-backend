/**
 * Enquiry Model
 * A patient selects clinic, doctor, and date/slot, and calls or sends an enquiry.
 * The clinic can Call, Accept for that day/slot, or Cancel.
 *
 * Table: enquiries
 */
module.exports = (sequelize, DataTypes) => {
  const Enquiry = sequelize.define(
    "Enquiry",
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
        comment:   "FK → clinics.id — enquiry is directed to this clinic"
      },
      doctor_id: {
        type:    DataTypes.BIGINT.UNSIGNED,
        comment: "FK → doctors.id — doctor selected by patient"
      },
      appointment_date: {
        type:    DataTypes.DATEONLY,
        comment: "Selected date (YYYY-MM-DD)"
      },
      appointment_time: {
        type:    DataTypes.STRING(50),
        comment: "Selected time (e.g. 10:30 AM)"
      },
      slot: {
        type:    DataTypes.STRING(100),
        comment: "Doctor schedule slot (e.g. Morning 10:00 AM - 01:00 PM)"
      },
      message: {
        type:      DataTypes.TEXT,
        allowNull: false,
        comment:   "Patient's enquiry message or call note"
      },
      reply: {
        type:    DataTypes.TEXT,
        comment: "Clinic note / reply"
      },
      status: {
        type:         DataTypes.STRING(50),
        defaultValue: "Pending",
        comment:      "Lifecycle state: Pending, Accepted, Cancelled"
      }
    },
    {
      tableName:  "enquiries",
      timestamps: true,
      createdAt:  "created_at",
      updatedAt:  false
    }
  );

  Enquiry.associate = (db) => {
    Enquiry.belongsTo(db.Patient, { foreignKey: "patient_id", as: "patient" });
    Enquiry.belongsTo(db.Clinic,  { foreignKey: "clinic_id",  as: "clinic"  });
    Enquiry.belongsTo(db.Doctor,  { foreignKey: "doctor_id",  as: "doctor"  });
  };

  return Enquiry;
};
