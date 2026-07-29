/**
 * DoctorSchedule Model
 * Weekly availability slots for a Doctor.
 * The slot_duration determines how appointments are broken up within the window.
 *
 * Table: doctor_schedule
 */
module.exports = (sequelize, DataTypes) => {
  const DoctorSchedule = sequelize.define(
    "DoctorSchedule",
    {
      id: {
        type:          DataTypes.BIGINT.UNSIGNED,
        primaryKey:    true,
        autoIncrement: true
      },
      doctor_id: {
        type:      DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        comment:   "FK → doctors.id"
      },
      day: {
        type:    DataTypes.ENUM(
          "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"
        ),
        allowNull: false,
        comment:   "Day of the week this slot applies to"
      },
      start_time: {
        type:      DataTypes.TIME,
        allowNull: false,
        comment:   "Session start time (HH:MM:SS)"
      },
      end_time: {
        type:      DataTypes.TIME,
        allowNull: false,
        comment:   "Session end time (HH:MM:SS)"
      },
      slot_duration: {
        type:      DataTypes.INTEGER,
        allowNull: false,
        comment:   "Duration of each appointment slot in minutes"
      },
      is_available: {
        type:         DataTypes.BOOLEAN,
        defaultValue: true,
        comment:      "Set to false to block this schedule without deleting it"
      }
    },
    {
      tableName:  "doctor_schedule",
      timestamps: true,
      createdAt:  "created_at",
      updatedAt:  false
    }
  );

  DoctorSchedule.associate = (db) => {
    DoctorSchedule.belongsTo(db.Doctor, { foreignKey: "doctor_id", as: "doctor" });
  };

  return DoctorSchedule;
};
