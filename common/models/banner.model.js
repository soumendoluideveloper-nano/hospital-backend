/**
 * Banner Model
 * Promotional / informational banners displayed in the patient-facing app.
 * Managed exclusively by Super Admins.
 *
 * Table: banners
 */
module.exports = (sequelize, DataTypes) => {
  const Banner = sequelize.define(
    "Banner",
    {
      id: {
        type:          DataTypes.BIGINT.UNSIGNED,
        primaryKey:    true,
        autoIncrement: true
      },
      title: {
        type:    DataTypes.STRING(255),
        comment: "Headline text shown on the banner"
      },
      image: {
        type:    DataTypes.STRING(255),
        comment: "Relative path to the banner image"
      },
      redirect_url: {
        type:    DataTypes.STRING(255),
        comment: "Deep-link or web URL opened when the banner is tapped"
      },
      status: {
        type:         DataTypes.ENUM("Active","Inactive"),
        defaultValue: "Active"
      }
    },
    {
      tableName:  "banners",
      timestamps: true,
      createdAt:  "created_at",
      updatedAt:  false
    }
  );

  return Banner;
};
