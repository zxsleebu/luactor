const { readFileSync } = require('fs');
const compile = (code, outfile) => {
    const { writeFileSync } = require('fs');
    const { execSync } = require('child_process');
    const { protect_literals } = require('./modules/literals');
    const { protect_objects } = require('./modules/objects');
    const { protect_globals } = require('./modules/globals');
    const { protect_functions } = require('./modules/functions');
    const { antidecompiler } = require('./modules/antidecompiler');
    const { scoper } = require('./modules/scoper');
    const { thiscallproxy } = require('./modules/thiscallproxy');
    var result = code;
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
        console.log(`${e.name}: ${e.message}`);
        writeFileSync("output-err.lua", result)
        console.log("\nerror occured. semi-compiled file saved to output-err.lua");
        return;
    }

    // log(`Writing file to ${outfile}...`)
    var absolutePath = require('path').resolve(outfile);
    writeFileSync(absolutePath, result)
    // log("Compiling...")
    //set working directory
    process.chdir(__dirname);
    execSync(`luajit -b "${absolutePath}" "${absolutePath}"`)
    console.log("Done!");
}
// add cli support
if(process.argv.length == 4){
    console.log(`Reading file ${process.argv[2]}...`);
    var result = readFileSync(process.argv[2], 'utf8');
    compile(result, process.argv[3]);
}
exports.compile = compile;