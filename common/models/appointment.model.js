/**
 * Appointment Model
 * A patient books a time slot with a doctor at a specific clinic.
 *
 * Status lifecycle:
 *   Pending → Confirmed → Completed
 *   Pending → Rejected
 *   Confirmed → Cancelled
 *
 * Table: appointments
 */
module.exports = (sequelize, DataTypes) => {
  const Appointment = sequelize.define(
    "Appointment",
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
      doctor_id: {
        type:      DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        comment:   "FK → doctors.id"
      },
      appointment_date: {
        type:      DataTypes.DATEONLY,
        allowNull: false,
        comment:   "Date of the appointment (YYYY-MM-DD)"
      },
      appointment_time: {
        type:      DataTypes.TIME,
        allowNull: false,
        comment:   "Time slot (HH:MM:SS)"
      },
      status: {
        type:         DataTypes.ENUM("Pending","Confirmed","Completed","Cancelled","Rejected"),
        defaultValue: "Pending",
        comment:      "Current lifecycle state of the appointment"
      },
      reason: {
        type:    DataTypes.TEXT,
        comment: "Patient-provided reason / chief complaint"
      },
      notes: {
        type:    DataTypes.TEXT,
        comment: "Doctor / clinic notes added after consultation"
      }
    },
    {
      tableName:  "appointments",
      timestamps: true,
      createdAt:  "created_at",
      updatedAt:  "updated_at"
    }
  );

  Appointment.associate = (db) => {
    Appointment.belongsTo(db.Patient, { foreignKey: "patient_id", as: "patient" });
    Appointment.belongsTo(db.Clinic,  { foreignKey: "clinic_id",  as: "clinic"  });
    Appointment.belongsTo(db.Doctor,  { foreignKey: "doctor_id",  as: "doctor"  });
  };

  return Appointment;
};
