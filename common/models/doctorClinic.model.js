/**
 * DoctorClinic Model
 * Junction / association table allowing a Doctor to practice across multiple Clinics.
 *
 * Table: doctor_clinics
 */
module.exports = (sequelize, DataTypes) => {
  const DoctorClinic = sequelize.define(
    "DoctorClinic",
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
      clinic_id: {
        type:      DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        comment:   "FK → clinics.id"
      },
      status: {
        type:         DataTypes.ENUM("Active", "Inactive"),
        defaultValue: "Active"
      }
    },
    {
      tableName:  "doctor_clinics",
      timestamps: true,
      createdAt:  "created_at",
      updatedAt:  "updated_at"
    }
  );

  DoctorClinic.associate = (db) => {
    DoctorClinic.belongsTo(db.Doctor, { foreignKey: "doctor_id", as: "doctor" });
    DoctorClinic.belongsTo(db.Clinic, { foreignKey: "clinic_id", as: "clinic" });
  };

  return DoctorClinic;
};
