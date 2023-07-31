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
const { control_flow } = require('./modules/control_flow');
const { post_encrypt } = require('./modules/post_encrypt');
const { security } = require('./modules/security');
const luactor = class {
    thiscallproxy = true;
    scoper = true;
    antidecompiler = true;
    literals = true;
    objects = true;
    globals = true;
    functions = true;
    security = true;
    jit = true;
    control_flow = false;
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
     * @param {Boolean} settings.control_flow
     * @param {Boolean} settings.security
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
            this.control_flow = settings.control_flow ?? this.control_flow;
            this.security = settings.security ?? this.security;
        }
    }
    compile = (code, outfile) => {
        var result = code;
        try{
            if(this.thiscallproxy)
                result = thiscallproxy(result)
            if(this.functions)
                result = protect_functions(result)
            if(this.globals)
                result = protect_globals(result)
            if(this.objects)
                result = protect_objects(result)
            if(this.literals){
                var [key, encrypted_string, encrypt_fn, script] = protect_literals(result)
                encrypt_fn = this.security ? security(encrypt_fn) : encrypt_fn
                var encrypted_fn = post_encrypt(encrypt_fn, encrypted_string, key)
                result = encrypted_fn + script
            }
            else if(this.security){
                result = security(result)
            }
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

if(process.argv.length == 4){
    console.log(`Reading file ${process.argv[2]}...`);
    var result = readFileSync(process.argv[2], 'utf8');
    var compiler = new luactor();
    compiler.compile(result, process.argv[3]);
}

module.exports = luactor;