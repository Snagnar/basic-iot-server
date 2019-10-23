/**
 * @file beautiful logger for basic-iot-server
 * @author Paul Mattes
 * @version 2019.10.23
 */

module.exports = {
    info(msg) {
        console.log("\x1b[36m%s\x1b[0m", " [ info ] "+msg);
    },
    error(msg) {
        console.log("\x1b[31m%s\x1b[0m", " [ error ] "+msg);
    },
    success(msg) {
        console.log("\x1b[32m%s\x1b[0m", " [ success ] "+msg);
    },
    warn(msg) {
        console.log("\x1b[33m%s\x1b[0m", " [ warn ] "+msg);
    }
}