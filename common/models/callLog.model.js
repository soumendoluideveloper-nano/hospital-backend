/**
 * CallLog Model
 * Records every audio / video call made between a patient and a doctor.
 * Used for call history, billing reference, and analytics.
 *
 * Table: call_logs
 */
module.exports = (sequelize, DataTypes) => {
  const CallLog = sequelize.define(
    "CallLog",
    {
      id: {
        type:          DataTypes.BIGINT.UNSIGNED,
        primaryKey:    true,
        autoIncrement: true
      },
      patient_id: {
        type:      DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        comment:   "FK → patients.id — initiator of the call"
      },
      clinic_id: {
        type:      DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        comment:   "FK → clinics.id — clinic the doctor belongs to"
      },
      doctor_id: {
        type:      DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        comment:   "FK → doctors.id — recipient of the call"
      },
      call_type: {
        type:         DataTypes.ENUM("Audio","Video"),
        defaultValue: "Audio",
        comment:      "Medium of the call"
      },
      duration: {
        type:         DataTypes.INTEGER,
        defaultValue: 0,
        comment:      "Call duration in seconds"
      },
      status: {
        type:         DataTypes.ENUM("Missed","Completed","Rejected"),
        defaultValue: "Completed",
        comment:      "Outcome of the call attempt"
      }
    },
    {
      tableName:  "call_logs",
      timestamps: true,
      createdAt:  "created_at",
      updatedAt:  false
    }
  );

  CallLog.associate = (db) => {
    CallLog.belongsTo(db.Patient, { foreignKey: "patient_id", as: "patient" });
    CallLog.belongsTo(db.Clinic,  { foreignKey: "clinic_id",  as: "clinic"  });
    CallLog.belongsTo(db.Doctor,  { foreignKey: "doctor_id",  as: "doctor"  });
  };

  return CallLog;
};
