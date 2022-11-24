var luaparse = require('luaparse');
const { replaceRange, logCounter } = require('./misc');
exports.protect_objects = function(string){
    var result = string + "";
    var tablecontructorskeys = [];
    var occurences = 0;
    const update_counter = logCounter(() => `Protected ${occurences} object keys declarations!`);
    luaparse.parse(string, {
        onCreateNode: async s => {
            if(s.type == "TableKeyString"){
                tablecontructorskeys.push({name: s.key.name, range: s.key.range})
                occurences++
                if(occurences % 2 == 0) update_counter();
            }
        },
        ranges: true,
    });
    update_counter();
    tablecontructorskeys.sort((a, b) => a.range[0] - b.range[0]);
    tablecontructorskeys.forEach(key => 
        result = replaceRange(result, key.range, `["${key.name}"]`, string)
    )
    string = result;
    console.log("")

    var memberindexers = 0;
    const update_counter_indexers = logCounter(() => `Protected ${memberindexers} object member indexers!`);
    luaparse.parse(string, {
        onCreateNode: async s => {
            if(s.type == "MemberExpression" && s.indexer == "."){
                memberindexers++
                if(memberindexers % 3 == 0) update_counter_indexers();
                result = replaceRange(result, [s.identifier.range[0] - 1, s.identifier.range[1]], `["${s.identifier.name}"]`, string);
            }
        },
        ranges: true,
    });
    update_counter_indexers()
    console.log("")
    return result
}