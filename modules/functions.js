var luaparse = require('luaparse');
const { replaceRange, logCounter, getRange } = require('./misc');
exports.protect_functions = function(string){
    // console.log("Protecting functions...")
    var result = string + "";
    var functiondeclarations = [];
    var occurences = 0;
    const update_counter = logCounter(() => `Protected ${occurences} function declarations!`);
    luaparse.parse(string, {
        onCreateNode: async s => {
            if(s.type == "FunctionDeclaration" && s.identifier){
                functiondeclarations.push({
                    name: string.substring(...s.identifier.range),
                    range: [s.range[0], s.identifier.range[1]],
                    indexer: s.identifier.indexer,
                    arguments_range: [s.identifier.range[1], s.range[1]],
                    arguments: s.parameters,
                })
                occurences++;
                if(occurences % 2 == 0) update_counter();
            }
        },
        ranges: true,
    });
    update_counter();
    functiondeclarations.sort((a, b) => a.range[0] - b.range[0]);
    functiondeclarations.forEach(fun => {
        if(fun.indexer == "."){
            result = replaceRange(result, fun.range, `${fun.name} = function`, string)
        }
        if(fun.indexer == ":"){
            result = replaceRange(result, fun.range, `${fun.name.replace(":", ".")} = function`, string)
            let pos = fun.arguments_range[0] + getRange(result, fun.arguments_range, string).indexOf("(")
            let comma = fun.arguments.length > 0 ? ", " : "";
            result = replaceRange(result, [pos, pos + 1], `(self${comma}`, string)
        }
    })
    console.log("")
    return result
}