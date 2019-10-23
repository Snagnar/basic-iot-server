/**
 * @file config module for basic-iot-server to load json files into objects
 * @author Paul Mattes
 * @version 2019.23.10
*/

//Modules
const fs = require("fs");
const path = require("path");

module.exports = (dir, file = "config.default.json") => {
    return dir && fs.existsSync(path.join(dir, file)) ? require(path.join(dir, file)) : null;
}