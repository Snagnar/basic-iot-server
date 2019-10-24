/**
 * @file main file of the basic-iot-server. Registers all
 * defined routes and passes arguments if necessary.
 * @author Paul Mattes
 * @version 2019.10.23
 */

// Imports
const path = require("path");

// Modules
const server = require("./src/server");
const config = require("./src/config")(__dirname);

server.loadAndRegisterRoutes(path.join(__dirname, config.routes_directory));
setTimeout(server.begin, 500);