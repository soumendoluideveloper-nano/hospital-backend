/**
 * OtpVerification Model
 * Temporarily stores a pending registration's phone, hashed password, and OTP.
 * Deleted / marked used once the user completes profile.
 *
 * Table: otp_verifications
 */
module.exports = (sequelize, DataTypes) => {
  const OtpVerification = sequelize.define(
    "OtpVerification",
    {
      id: {
        type:          DataTypes.BIGINT.UNSIGNED,
        primaryKey:    true,
        autoIncrement: true
      },
      phone: {
        type:      DataTypes.STRING(20),
        allowNull: false,
        comment:   "Mobile number being verified"
      },
      password: {
        type:      DataTypes.STRING(255),
        allowNull: false,
        comment:   "Bcrypt-hashed password stored temporarily until profile is completed"
      },
      otp: {
        type:      DataTypes.STRING(6),
        allowNull: false,
        comment:   "6-digit one-time password"
      },
      type: {
        type:      DataTypes.ENUM("patient", "clinic"),
        allowNull: false,
        comment:   "Which actor type is registering"
      },
      is_used: {
        type:         DataTypes.BOOLEAN,
        defaultValue: false,
        comment:      "Marked true after OTP is successfully verified"
      },
      expires_at: {
        type:      DataTypes.DATE,
        allowNull: false,
        comment:   "OTP expiry timestamp (10 minutes from creation)"
      }
    },
    {
      tableName:  "otp_verifications",
      timestamps: true,
      createdAt:  "created_at",
      updatedAt:  false
    }
  );

  return OtpVerification;
};
