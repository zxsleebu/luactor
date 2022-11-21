var luaparse = require('luaparse');
const { readFileSync } = require('fs');
const { replaceRange, getRange } = require('./misc');
exports.thiscallproxy = function(string){
    // console.log('Protecting thiscalls...');
    const thiscallproxy = readFileSync('./modules/thiscallproxy.lua', 'utf-8');
    var result = string + "";
    var occurences = 0;
    while(true){
        var protected = false;
        luaparse.parse(string, {
            onCreateNode: s => {
                if(protected) return;
                if(s.type == "CallExpression" && s.base.type == "MemberExpression" && s.base.indexer == ":"){
                    occurences++;
                    let range = [s.base.range[0], s.base.identifier.range[0] - 1];
                    let base = getRange(result, range, string);
                    let args = s.arguments.map(a => getRange(result, a.range, string)).join(", ");
                    args = args ? ", " + args  : "";
                    result = replaceRange(result, s.base.range, `lua__thiscall_proxy(${base}, "${s.base.identifier.name}"${args})`, string)
                    protected = true;
                }
            },
            ranges: true,
        })
        string = result + "";
        if(!protected)
            break;
    }
    console.log(`Protected ${occurences} thicalls!`);
    return thiscallproxy + "\n" + result
}
