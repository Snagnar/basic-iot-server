/**
 * @file server module for basic-iot-server. registers all routes defined in routes directory.
 */

// Modules
const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");

//Imports
const config = require("config")(path.join(__dirname, ".."));
const logger = require("logger");

app.use(bodyParser());

module.exports = {
    loadAndRegisterRoutes(dir) {
        logger.info("Registering routes...");
        fs.readdir(dir, (err, files) => {
            if(err) {
                logger.error(err);
                return;
            }
            files.map(file => {
                const routeConfig = require("config")(path.join(dir, file));
                if(!routeConfig.method || !routeConfig.args) {
                    logger.error(`invalid config at route ${file}`);
                    return;
                }

                switch (routeConfig.method) {
                    case "get":
                        app.get("/api/"+file, async (req, res) => {
                            const validRequest = routeConfig.args.reduce((prev, arg) => {
                                if(!req.qs['arg']) {
                                    logger.error(`Invalid request on endpoint ${file}: Argument ${arg} is missing!`);
                                    prev = false;
                                }
                            }, true);
                            if(!validRequest) {
                                res.status(400);
                                res.send(`Invalid request!`);
                                return;
                            }
                            await this.executeScripts(path.join(dir,file));
                            res.status(200);
                            res.send("Request has been executed.");
                        });
                        break;
                    case "post":
                        break;
                }
            });
        });
    },
    executeScripts(dir) {
        if(!dir || !fs.existsSync(path.join(dir, "scripts"))) {
            logger.warn(`No scripts-directory found at route ${path.parse(dir).base}`)
        }
    }
}