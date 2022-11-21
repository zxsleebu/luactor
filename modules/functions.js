var luaparse = require('luaparse');
const { replaceRange } = require('./misc');
exports.protect_functions = function(string){
    // console.log("Protecting functions...")
    var result = string + "";
    var functiondeclarations = [];
    luaparse.parse(string, {
        onCreateNode: async s => {
            if(s.type == "FunctionDeclaration" && s.identifier)
                functiondeclarations.push({name: string.substring(...s.identifier.range), range: [s.range[0], s.identifier.range[1]]})
        },
        ranges: true,
    });
    functiondeclarations.sort((a, b) => a.range[0] - b.range[0]);
    functiondeclarations.forEach(fun => 
        result = replaceRange(result, fun.range, `${fun.name} = function`, string)
    )
    console.log(`Protected ${functiondeclarations.length} function declarations!`);
    return result
}