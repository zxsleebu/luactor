const log = console.log;
log("Starting compilation...");
const { readFileSync, writeFileSync } = require('fs');
const { execSync } = require('child_process');
const { protect_literals } = require('./modules/literals');
const { protect_objects } = require('./modules/objects');
const { protect_globals } = require('./modules/globals');
const { protect_functions } = require('./modules/functions');
const { antidecompiler } = require('./modules/antidecompiler');
const { scoper } = require('./modules/scoper');
const { thiscallproxy } = require('./modules/thiscallproxy');
if(process.argv.length < 4)
    return log("Not enough arguments. 1st = input, 2nd = output")
log(`Reading file ${process.argv[2]}...`);
var result = readFileSync(process.argv[2], 'utf8');
try{
    result = protect_functions(result);
    result = protect_globals(result);
    result = protect_objects(result)
    result = thiscallproxy(result);
    result = protect_literals(result)
    result = antidecompiler(result)
    result = scoper(result)
}
catch(e){
    log(`${e.name}: ${e.message}`);
    writeFileSync("output-err.lua", result)
    console.log("\nerror occured. semi-compiled file saved to output-err.lua");
    return;
}

log(`Writing file to ${process.argv[3]}...`)
writeFileSync(process.argv[3], result)
log("Compiling...")
execSync(`luajit -b "${process.argv[3]}" "${process.argv[3]}"`)
log("Done!");