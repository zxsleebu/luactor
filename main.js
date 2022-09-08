const date = require('date-and-time')
const log = console.log;
log("Starting compilation...");
const { minify } = require('luamin');
const {readFileSync, writeFileSync, copyFileSync, statSync} = require('fs');
const {execSync, spawnSync} = require('child_process');
const {protect_strings} = require('./modules/strings');
const {protect_objects} = require('./modules/objects');
const {antidecompiler} = require('./modules/antidecompiler');
const {optimize} = require('./modules/optimize');
const {ordinal} = require('./modules/ordinal');
log("Reading file...");
var storm_gui = readFileSync('storm-gui.lua', 'utf8');
result = optimize(result);
result = protect_objects(result, {
    // security: 1,
    // extended: 1,
    // logger: -1,
    // elems: -1,
    bit32: -1,
    // resources: -1,
    debug: -1,
    os: -1,
    io: -1,
    // shell: -1,
    // wininet: -1,
    // urlmon: -1,
    // user32: -1,
    _G: -1,
});
result = protect_strings(result);
log("Minifying code...");
result = minify(result);
result = antidecompiler(result)
log("Writing file...");
writeFileSync('storm-build.lua', result);
log("Compiling...");
execSync("cd compiler & luajit -b ../storm-build.lua ../storm-build.lua & cd..")
copyFileSync('storm-build.lua', 'web/storm.lua');
const {size: fileSize} = statSync('storm-build.lua');
log("Done!");