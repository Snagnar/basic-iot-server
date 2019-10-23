/**
 * @file server module for basic-iot-server. registers all routes defined in routes directory.
 */

// Modules
const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const spawn = require("child_process").spawn;

//Imports
const config = require("config")(path.join(__dirname, ".."));
const logger = require("logger");

app.use(bodyParser());
app.use((req, res, next) => {
    res.status(404).send("That route does not exist!");
});


module.exports = {
    loadAndRegisterRoutes(dir) {
        return new Promise((resolve,reject) => {

            logger.info("Registering routes...");

            //read all subdirectories in the routes folder 
            fs.readdir(dir, (err, files) => {

                if(err) {
                    logger.error(err);
                    return reject(err);
                }
                
                // now register a route for every subdirectory
                files.map(file => {

                    // load the config.default.json from subdirectory (required)
                    const routeConfig = require("config")(path.join(dir, file));
                    if(!routeConfig.method || !routeConfig.args) {
                        logger.error(`invalid config at route ${file}`);
                        return;
                    }

                    // register route with options defined in config.default.json
                    switch (routeConfig.method) {

                        // register get route
                        case "get":

                            app.get("/api/"+file, async (req, res) => {

                                // check request validity by checking if every arg from config is present in query string
                                const validRequest = routeConfig.args.reduce((prev, arg) => {
                                    if(!req.qs['arg']) {
                                        logger.error(`Invalid request on endpoint ${file}: Argument ${arg} is missing!`);
                                        prev = false;
                                    }
                                }, true);

                                //abort if request was invalid
                                if(!validRequest) {
                                    res.status(400);
                                    res.send(`Invalid request!`);
                                    return;
                                }

                                // else execute all .sh scripts in scripts directory in routes subfolder
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
        });
    },
    /**
     * executes all scripts in dir/scripts subdirectory, giving data as cli arguments.
     * resolves once all scripts are done executing.
     * @param dir subdirectory in which the scripts directory should be located.
     * @param data 
     */ 
    executeScripts(dir, data) {

        return new Promise( async(resolve, reject) => {
            if(!dir || !fs.existsSync(path.join(dir, "scripts"))) {
                logger.warn(`No scripts-directory found at route ${path.parse(dir).base}`);
                return reject();
            }
            const argList = data.keys.reduce((prev, key) => {
                prev.push(`--${key} ${data.key}`);
            },[]);
            fs.readdir(path.join(dir, "scripts"), async (err, files) => {
                if(err) {
                    logger.error(`Error reading directory ${JSON.stringify(path.join(dir, "scripts"))}`);
                    return reject();
                }
                const executions = files.reduce((prev, file) => {
                    prev.push(new Promise((resolve, reject) => {
                        const ex=spawn("/bin/bash", argList.shift(path.join(dir, "scripts", file)));
                        ex.stdout.on('data', data => {
                            logger.info(`${file}: ${data}`);
                        });
                        ex.stderr.on('data', data => {
                            logger.warn(`${file}: ${data}`);
                        });
                        ex.on('close', code => {
                            logger[code!=0 ? "warn" : "success"]( `Execution of script ${file} ${code!=0 ? "failed" : "succeded"}!`);
                            resolve();
                        });
                    }));
                }, []);
                await Promise.all(executions);
                resolve();
            });
        });
    },
    begin() {
        app.listen(config.port, () => {
            logger.success(`Server is now listening on port ${config.port}`);
        });
    }
}