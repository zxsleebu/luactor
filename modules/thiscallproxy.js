var luaparse = require('luaparse');
const { readFileSync } = require('fs');
const { replaceRange, getRange, logCounter } = require('./misc');
exports.thiscallproxy = function(string){
    // console.log('Protecting thiscalls...');
    const thiscallproxy = readFileSync(__dirname + '/thiscallproxy.lua', 'utf-8');
    var result = string + "";
    var occurences = 0;
    const update_counter = logCounter(() => `Protected ${occurences} thiscalls!`);
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
            if(occurences % 3 == 0) update_counter();
            if(!protected)
                break;
        }
    }
    catch(err){
        update_counter();
        console.log("")
        return thiscallproxy + "\n" + result
    }
    update_counter();
    console.log("")
    return thiscallproxy + "\n" + result
}
