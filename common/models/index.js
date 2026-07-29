/**
 * Models Index
 * Auto-discovers and loads all *.model.js files in this directory,
 * registers them on the `db` object, and runs associations.
 *
 * Usage (in any service):
 *   const db = require('../../common/models');
 *   const patient = await db.Patient.findByPk(id);
 */

const fs        = require("fs");
const path      = require("path");
const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:    process.env.DB_HOST     || "localhost",
    port:    process.env.DB_PORT     || 3306,
    dialect: process.env.DB_DIALECT  || "mysql",
    logging: false,
    pool: {
      max:     10,
      min:     0,
      acquire: 30000,
      idle:    10000
    }
  }
);

const db = {};

fs.readdirSync(__dirname)
  .filter(file => file.endsWith(".model.js") && !file.startsWith("."))
  .forEach(file => {
    const modelFunc = require(path.join(__dirname, file));
    if (typeof modelFunc !== "function") {
      console.error(`🔴  Invalid model export in: ${file}`);
      return;
    }
    const model = modelFunc(sequelize, DataTypes);
    if (!model || !model.name) {
      console.error(`⚠️  Model did not return a proper object in: ${file}`);
      return;
    }
    db[model.name] = model;
  });

// Run associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
