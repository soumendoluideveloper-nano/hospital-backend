/**
 * Company Details Model
 * Platform master settings for company address, contact info, social links,
 * map link, logo, and favicon.
 * Managed exclusively by Super Admins.
 *
 * Table: company_details
 */
module.exports = (sequelize, DataTypes) => {
  const CompanyDetail = sequelize.define(
    "CompanyDetail",
    {
      id: {
        type:          DataTypes.BIGINT.UNSIGNED,
        primaryKey:    true,
        autoIncrement: true
      },
      company_name: {
        type:         DataTypes.STRING(255),
        allowNull:    false,
        defaultValue: "Health Spot Clinic"
      },
      tagline: {
        type:         DataTypes.STRING(255),
        defaultValue: "Your Trusted Healthcare Partner"
      },
      email: {
        type:         DataTypes.STRING(150),
        defaultValue: "contact@healthspot.com"
      },
      phone: {
        type:         DataTypes.STRING(50),
        defaultValue: "+91 9876543210"
      },
      alternate_phone: {
        type: DataTypes.STRING(50)
      },
      address: {
        type: DataTypes.TEXT
      },
      city: {
        type:         DataTypes.STRING(100),
        defaultValue: "Kolkata"
      },
      state: {
        type:         DataTypes.STRING(100),
        defaultValue: "West Bengal"
      },
      country: {
        type:         DataTypes.STRING(100),
        defaultValue: "India"
      },
      pincode: {
        type:         DataTypes.STRING(20),
        defaultValue: "700001"
      },
      website_url: {
        type:         DataTypes.STRING(255),
        defaultValue: "https://healthspot.com"
      },
      map_link: {
        type: DataTypes.TEXT
      },
      facebook_url: {
        type: DataTypes.STRING(255)
      },
      twitter_url: {
        type: DataTypes.STRING(255)
      },
      instagram_url: {
        type: DataTypes.STRING(255)
      },
      linkedin_url: {
        type: DataTypes.STRING(255)
      },
      youtube_url: {
        type: DataTypes.STRING(255)
      },
      whatsapp_no: {
        type: DataTypes.STRING(50)
      },
      logo: {
        type: DataTypes.STRING(255)
      },
      favicon: {
        type: DataTypes.STRING(255)
      },
      footer_text: {
        type: DataTypes.TEXT
      },
      about_us: {
        type: DataTypes.TEXT
      },
      privacy_policy: {
        type: DataTypes.TEXT("long")
      },
      terms_and_conditions: {
        type: DataTypes.TEXT("long")
      },
      status: {
        type:         DataTypes.ENUM("Active", "Inactive"),
        defaultValue: "Active"
      }
    },
    {
      tableName:  "company_details",
      timestamps: true,
      createdAt:  "created_at",
      updatedAt:  "updated_at"
    }
  );

  return CompanyDetail;
};
