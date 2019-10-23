/**
 * @file main file of the basic-iot-server. Registers all
 * defined routes and passes arguments if necessary.
 * @author Paul Mattes
 * @version 2019.10.23
 */

// Imports

// Modules
const logger = require("src/logger");
const config = require("src/config")(__dirname);
const server = require("src/server");

await server.loadAndRegisterRoutes(config.routes_directory);
await server.begin();
logger.success("Now started everything!");