/**
 * ClinicReview Model
 * A patient rates and reviews an overall clinic experience.
 *
 * Table: clinic_reviews
 */
module.exports = (sequelize, DataTypes) => {
  const ClinicReview = sequelize.define(
    "ClinicReview",
    {
      id: {
        type:          DataTypes.BIGINT.UNSIGNED,
        primaryKey:    true,
        autoIncrement: true
      },
      clinic_id: {
        type:      DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        comment:   "FK → clinics.id"
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
      tableName:  "clinic_reviews",
      timestamps: true,
      createdAt:  "created_at",
      updatedAt:  false
    }
  );

  ClinicReview.associate = (db) => {
    ClinicReview.belongsTo(db.Clinic,  { foreignKey: "clinic_id",  as: "clinic"  });
    ClinicReview.belongsTo(db.Patient, { foreignKey: "patient_id", as: "patient" });
  };

  return ClinicReview;
};
