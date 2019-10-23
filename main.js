/**
 * @file main file of the basic-iot-server. Registers all
 * defined routes and passes arguments if necessary.
 * @author Paul Mattes
 * @version 2019.10.23
 */

// Imports
const path = require("path");

// Modules
const logger = require("./src/logger");
const config = require("./src/config")(__dirname);
const server = require("./src/server");


server.loadAndRegisterRoutes(path.join(__dirname, config.routes_directory));
// .then(() => {
// server.begin();
// });
setTimeout(server.begin, 1000);
logger.success("Now started everything!");