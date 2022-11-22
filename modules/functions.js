var luaparse = require('luaparse');
const { replaceRange } = require('./misc');
exports.protect_functions = function(string){
    // console.log("Protecting functions...")
    var result = string + "";
    var functiondeclarations = [];
    var occurences = 0;
    luaparse.parse(string, {
        onCreateNode: async s => {
            if(s.type == "FunctionDeclaration" && s.identifier){
                functiondeclarations.push({name: string.substring(...s.identifier.range), range: [s.range[0], s.identifier.range[1]]})
                process.stdout.cursorTo(0);
                process.stdout.write(`Protected ${++occurences} function declarations!`);
            }
        },
        ranges: true,
    });
    functiondeclarations.sort((a, b) => a.range[0] - b.range[0]);
    functiondeclarations.forEach(fun => 
        result = replaceRange(result, fun.range, `${fun.name} = function`, string)
    )
    console.log("")
    return result
}