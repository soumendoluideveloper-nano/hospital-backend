/**
 * DoctorReview Model
 * A patient rates and reviews a doctor after a consultation or call.
 * Rating must be between 1 and 5 (validated at application level).
 *
 * Table: doctor_reviews
 */
module.exports = (sequelize, DataTypes) => {
  const DoctorReview = sequelize.define(
    "DoctorReview",
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
      patient_id: {
        type:      DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        comment:   "FK → patients.id"
      },
      rating: {
        type:      DataTypes.TINYINT,
        allowNull: false,
        comment:   "Star rating 1–5"
      },
      review: {
        type:    DataTypes.TEXT,
        comment: "Optional written feedback"
      }
    },
    {
      tableName:  "doctor_reviews",
      timestamps: true,
      createdAt:  "created_at",
      updatedAt:  false
    }
  );

  DoctorReview.associate = (db) => {
    DoctorReview.belongsTo(db.Doctor,  { foreignKey: "doctor_id",  as: "doctor"  });
    DoctorReview.belongsTo(db.Patient, { foreignKey: "patient_id", as: "patient" });
  };

  return DoctorReview;
};
