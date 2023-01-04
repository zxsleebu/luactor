const { readFileSync } = require('fs');
const { writeFileSync } = require('fs');
const { execSync } = require('child_process');
const { protect_literals } = require('./modules/literals');
const { protect_objects } = require('./modules/objects');
const { protect_globals } = require('./modules/globals');
const { protect_functions } = require('./modules/functions');
const { antidecompiler } = require('./modules/antidecompiler');
const { scoper } = require('./modules/scoper');
const { thiscallproxy } = require('./modules/thiscallproxy');
const luactor = class {
    thiscallproxy = true;
    scoper = true;
    antidecompiler = true;
    literals = true;
    objects = true;
    globals = true;
    functions = true;
    jit = true;
    /**
     * 
     * @param {Object} settings
     * @param {Boolean} settings.thiscallproxy
     * @param {Boolean} settings.scoper
     * @param {Boolean} settings.antidecompiler
     * @param {Boolean} settings.literals
     * @param {Boolean} settings.objects
     * @param {Boolean} settings.globals
     * @param {Boolean} settings.functions 
     * @param {Boolean} settings.jit
     */
    constructor(settings){
        if(settings){
            this.thiscallproxy = settings.thiscallproxy ?? this.thiscallproxy;
            this.scoper = settings.scoper ?? this.scoper;
            this.antidecompiler = settings.antidecompiler ?? this.antidecompiler;
            this.literals = settings.literals ?? this.literals;
            this.objects = settings.objects ?? this.objects;
            this.globals = settings.globals ?? this.globals;
            this.functions = settings.functions ?? this.functions;
            this.jit = settings.jit ?? this.jit;
        }
    }
    compile = (code, outfile) => {
        var result = code;
        try{
            if(this.functions)
                result = protect_functions(result)
            if(this.globals)
                result = protect_globals(result)
            if(this.objects)
                result = protect_objects(result)
            if(this.thiscallproxy)
                result = thiscallproxy(result)
            if(this.literals)
                result = protect_literals(result)
            if(this.antidecompiler)
                result = antidecompiler(result)
            if(this.scoper)
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
        if(this.jit){
            process.chdir(__dirname);
            execSync(`luajit -b "${absolutePath}" "${absolutePath}"`)
        }
        console.log("Done!");
    }
}
// add cli support
if(process.argv.length == 4){
    console.log(`Reading file ${process.argv[2]}...`);
    var result = readFileSync(process.argv[2], 'utf8');
    var compiler = new luactor();
    compiler.compile(result, process.argv[3]);
}
module.exports = luactor;