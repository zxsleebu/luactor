var luaparse = require('luaparse');
const { replaceRange, logCounter } = require('./misc');
exports.protect_functions = function(string){
    // console.log("Protecting functions...")
    var result = string + "";
    var functiondeclarations = [];
    var occurences = 0;
    const update_counter = logCounter(() => `Protected ${occurences} function declarations!`);
    luaparse.parse(string, {
        onCreateNode: async s => {
            if(s.type == "FunctionDeclaration" && s.identifier){
                functiondeclarations.push({name: string.substring(...s.identifier.range), range: [s.range[0], s.identifier.range[1]]})
                occurences++;
                if(occurences % 2 == 0) update_counter();
            }
        },
        ranges: true,
    });
    update_counter();
    functiondeclarations.sort((a, b) => a.range[0] - b.range[0]);
    functiondeclarations.forEach(fun => 
        result = replaceRange(result, fun.range, `${fun.name} = function`, string)
    )
    console.log("")
    return result
}