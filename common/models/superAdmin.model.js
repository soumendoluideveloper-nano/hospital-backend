/**
 * SuperAdmin Model
 * Platform-level administrator with full access to all clinics, patients,
 * banners, and notifications.
 *
 * Table: super_admins
 */
module.exports = (sequelize, DataTypes) => {
  const SuperAdmin = sequelize.define(
    "SuperAdmin",
    {
      id: {
        type:          DataTypes.BIGINT.UNSIGNED,
        primaryKey:    true,
        autoIncrement: true
      },
      name: {
        type:      DataTypes.STRING(100),
        allowNull: false,
        comment:   "Full name of the super admin"
      },
      email: {
        type:      DataTypes.STRING(150),
        allowNull: false,
        unique:    true,
        comment:   "Login email address"
      },
      password: {
        type:      DataTypes.STRING(255),
        allowNull: false,
        comment:   "Bcrypt-hashed password"
      },
      phone: {
        type:    DataTypes.STRING(20),
        comment: "Contact phone number"
      },
      token: {
        type:    DataTypes.TEXT,
        comment: "Current active JWT (used for single-session enforcement)"
      },
      status: {
        type:         DataTypes.ENUM("Active", "Inactive"),
        defaultValue: "Active"
      }
    },
    {
      tableName:  "super_admins",
      timestamps: true,
      createdAt:  "created_at",
      updatedAt:  "updated_at"
    }
  );

  return SuperAdmin;
};
