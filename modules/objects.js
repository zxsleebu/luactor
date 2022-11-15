var luaparse = require('luaparse');
const { replaceRange } = require('./misc');
exports.protect_objects = function(string){
    var result = string + "";
    var tablecontructorskeys = [];
    luaparse.parse(string, {
        onCreateNode: async s => {
            if(s.type == "TableKeyString")
                tablecontructorskeys.push({name: s.key.name, range: s.key.range})
        },
        ranges: true,
    });
    tablecontructorskeys.sort((a, b) => a.range[0] - b.range[0]);
    tablecontructorskeys.forEach(key => 
        result = replaceRange(result, key.range, `["${key.name}"]`, string)
    )
    console.log("Protected object keys declarations!");
    string = result;

    luaparse.parse(string, {
        onCreateNode: async s => {
            if(s.type == "MemberExpression" && s.indexer == ".")
                result = replaceRange(result, [s.identifier.range[0] - 1, s.identifier.range[1]], `["${s.identifier.name}"]`, string);
        },
        ranges: true,
    });
    console.log("Protected object member indexers!");
    return result
}