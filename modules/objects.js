var luaparse = require('luaparse');
const { replaceRange } = require('./misc');
exports.protect_objects = function(string){
    var result = string + "";
    var tablecontructorskeys = [];
    var occurences = 0;
    luaparse.parse(string, {
        onCreateNode: async s => {
            if(s.type == "TableKeyString"){
                tablecontructorskeys.push({name: s.key.name, range: s.key.range})
                process.stdout.cursorTo(0);
                process.stdout.write(`Protected ${++occurences} object keys declarations!`);
            }
        },
        ranges: true,
    });
    tablecontructorskeys.sort((a, b) => a.range[0] - b.range[0]);
    tablecontructorskeys.forEach(key => 
        result = replaceRange(result, key.range, `["${key.name}"]`, string)
    )
    string = result;
    console.log("")

    var memberindexers = 0;
    luaparse.parse(string, {
        onCreateNode: async s => {
            if(s.type == "MemberExpression" && s.indexer == "."){
                process.stdout.cursorTo(0);
                process.stdout.write(`Protected ${++memberindexers} object keys declarations!`);
                result = replaceRange(result, [s.identifier.range[0] - 1, s.identifier.range[1]], `["${s.identifier.name}"]`, string);
            }
        },
        ranges: true,
    });
    console.log("")
    return result
}