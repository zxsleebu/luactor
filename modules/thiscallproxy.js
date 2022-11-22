var luaparse = require('luaparse');
const { readFileSync } = require('fs');
const { replaceRange, getRange } = require('./misc');
exports.thiscallproxy = function(string){
    // console.log('Protecting thiscalls...');
    const thiscallproxy = readFileSync('./modules/thiscallproxy.lua', 'utf-8');
    var result = string + "";
    var occurences = 0;
    try{
        while(true){
            var protected = false;
            luaparse.parse(string, {
                onCreateNode: s => {
                    if(protected) return;
                    if(s.type == "CallExpression" && s.base.type == "MemberExpression" && s.base.indexer == ":"){
                        occurences++;
                        let range = [s.base.range[0], s.base.identifier.range[0] - 1];
                        let base = getRange(string, range, string);
                        let args = getRange(string, [s.base.identifier.range[1] + 1, s.base.range[1] - 1], string);
                        if(s.arguments.length > 0) args = ", " + args;
                        result = replaceRange(result, s.base.range, `lua__thiscall_proxy(${base}, "${s.base.identifier.name}"${args})`, string)
                        protected = true;
                    }
                },
                ranges: true,
            })
            string = result + "";
            process.stdout.cursorTo(0);
            process.stdout.write(`Protected ${occurences} thiscalls!`);
            if(!protected)
                break;
        }
    }
    catch(err){
        console.log("")
        return thiscallproxy + "\n" + result
    }
    console.log("")
    return thiscallproxy + "\n" + result
}
