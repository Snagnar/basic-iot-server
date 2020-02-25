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
const config = require("./config")(path.join(__dirname, ".."));
const logger = require("./logger");

// // app.use(bodyParser());6


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
                    logger.info(`getting config of ${path.join(dir,file)}`);
                    const routeConfig = require("./config")(path.join(dir, file));
                    if(!routeConfig.method || !routeConfig.args) {
                        logger.error(`invalid config at route ${file}`);
                        return;
                    }

                    // register route with options defined in config.default.json
                    switch (routeConfig.method) {

                        // register get route
                        case "get":
                            logger.info(`registering get for route /api/${file}`)
                            app.get("/api/"+file, async (req, res) => {
                                logger.success(`got request on route /api/${file}`);                                

                                // check request validity by checking if every arg from config is present in query string
                                const validRequest = routeConfig.args.reduce((prev, arg) => {
                                    if(! (arg in req.query)) {
                                        logger.error(`Invalid request on endpoint ${file}: Argument ${arg} is missing!`);
                                        prev = false;
                                    }
                                    return prev;
                                }, true);

                                //abort if request was invalid
                                if(!validRequest) {
                                    res.status(400);
                                    res.send(`Invalid request!`);
                                    return;
                                }
                                
                                // else execute all .sh scripts in scripts directory in routes subfolder
                                await this.executeScripts(path.join(dir,file), req.query);
                                if(routeConfig.response)
                                    await this.respond(routeConfig.response, res);
                                else {
                                    res.status(200);
                                    res.send("Request has been executed.");
                                }
                            });
                            break;
                        // register post route
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
            const argList = Object.keys(data).reduce((prev, key) => {
                prev.push(`--${key} ${data[key]}`);
                return prev;
            },[]);

            fs.readdir(path.join(dir, "scripts"), async (err, files) => {
                if(err) {
                    logger.error(`Error reading directory ${JSON.stringify(path.join(dir, "scripts"))}`);
                    return reject();
                }
                const executions = files.reduce((prev, file) => {
                    prev.push(new Promise((resolve, reject) => {
                        logger.info(`Executing script ${file}`);
                        const ex=spawn("/bin/bash", [path.join(dir, "scripts", file), ...argList]);
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
                    return prev;
                }, []);
                await Promise.all(executions);
                resolve();
            });
        });
    },

    async begin() {
        app.use((req, res, next) => {
            res.status(404).send("That route does not exist!");
        });
        app.listen(config.port, () => {
            logger.success(`Server is now listening on port ${config.port}!`);
        });
    },

    /**
     * handles custom response configuration specified in the route's config file
     * @param {Object} response contains type (script or static) and specification (script path or static response content) of response
     * @param {*} res 
     * @param {*} req 
     */
    respond(response, res, req) {
        return new Promise((resolve, reject) => {
            switch(response.type) {
                case "static":
                    res.status(200);
                    res.send(response.content);
                    resolve();
                    break;
                case "script":
                    let argList = [], outputBuffer = "";
                    const scriptPath = path.join(__dirname, "..", response.script);
                    logger.info(`Executing response script: ${scriptPath}`);
                    if(req) {
                        argList = Object.keys(data).reduce((prev, key) => {
                            prev.push(`--${key} ${data[key]}`);
                            return prev;
                        },[]);
                    }
                    const ex = spawn("/bin/bash", [scriptPath, ...argList]);
                    ex.stdout.on('data', data => {
                        if(data)
                            outputBuffer += data;
                    });
                    ex.stderr.on('data', data => {
                        logger.warn(`outputScript error: ${data}`);
                    });
                    ex.on('close', code => {
                        logger[code!=0 ? "warn" : "success"]( `Execution of script ${scriptPath} ${code!=0 ? "failed" : "succeded"}!`);
                        if(code != 0) {
                            res.status(500);
                            res.send("Internal error in response script!");
                            reject();
                        }
                        else {
                            res.status(200);
                            res.send(outputBuffer);
                            resolve();
                        }
                    })

            }
        })
    }
}