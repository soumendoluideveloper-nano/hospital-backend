/**
 * Enquiry Model
 * A patient sends a text message / question to a clinic or specific doctor.
 * The clinic responds and eventually closes the thread.
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
        comment: "FK → doctors.id — optional, if directed at a specific doctor"
      },
      message: {
        type:      DataTypes.TEXT,
        allowNull: false,
        comment:   "Patient's enquiry message"
      },
      reply: {
        type:    DataTypes.TEXT,
        comment: "Clinic / doctor's reply message"
      },
      status: {
        type:         DataTypes.ENUM("Pending","Answered","Closed"),
        defaultValue: "Pending",
        comment:      "Lifecycle state: Pending → Answered → Closed"
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
