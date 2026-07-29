/**
 * Notification Model
 * In-app push notifications sent to Patients, Clinics, or SuperAdmins.
 * Uses a polymorphic receiver_type + receiver_id pattern.
 *
 * Table: notifications
 */
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    "Notification",
    {
      id: {
        type:          DataTypes.BIGINT.UNSIGNED,
        primaryKey:    true,
        autoIncrement: true
      },
      receiver_type: {
        type:      DataTypes.ENUM("Patient","Clinic","SuperAdmin"),
        allowNull: false,
        comment:   "Discriminator for the polymorphic receiver"
      },
      receiver_id: {
        type:      DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        comment:   "PK of the receiver in their respective table"
      },
      title: {
        type:    DataTypes.STRING(255),
        comment: "Short notification title"
      },
      message: {
        type:    DataTypes.TEXT,
        comment: "Full notification body text"
      },
      is_read: {
        type:         DataTypes.BOOLEAN,
        defaultValue: false,
        comment:      "Whether the receiver has seen / read this notification"
      }
    },
    {
      tableName:  "notifications",
      timestamps: true,
      createdAt:  "created_at",
      updatedAt:  false
    }
  );

  return Notification;
};
