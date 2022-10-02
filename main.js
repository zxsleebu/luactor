const log = console.log;
log("Starting compilation...");
const { minify } = require('luamin');
const { readFileSync, writeFileSync } = require('fs');
const { execSync } = require('child_process');
const { protect_strings } = require('./modules/strings');
const { protect_objects } = require('./modules/objects');
const { antidecompiler } = require('./modules/antidecompiler');
const { scoper } = require('./modules/scoper');
// const { optimize } = require('./modules/optimize');
if(process.argv.length < 4){
    log("Not enough arguments. 1st = input, 2nd = output")
    return;
}
log(`Reading file ${process.argv[2]}...`);
var result = readFileSync(process.argv[2], 'utf8');
// result = optimize(result);
result = protect_objects(result, {
    bit32: -1,
    debug: -1,
    os: -1,
    io: -1,
    _G: -1,
})
result = protect_strings(result)
log("Minifying code...")
result = minify(result)
result = antidecompiler(result)
result = scoper(result)
log(`Writing file to ${process.argv[3]}...`)
writeFileSync(process.argv[3], result)
log("Compiling...")
execSync(`luajit -b ${process.argv[3]} ${process.argv[3]}`)
log("Done!");