const fs     = require("fs");
const path   = require("path");
const router = require("express").Router();

fs.readdirSync(__dirname)
  .filter(file => file !== "index.js" && file.endsWith(".routes.js"))
  .forEach(file => {
    const route = require(path.join(__dirname, file));
    router.use(route);
  });

module.exports = router;
