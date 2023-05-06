var luaparse = require('luaparse');
const { readFileSync, stat } = require('fs');
const generateUniqueName = () =>
    "FlatIdent_" + Math.random().toString(36).substring(2, 7).toUpperCase()
const { replaceRange, getRange, logCounter } = require('./misc');
exports.control_flow = string => {
    var new_string = string + "";
    /**
     * 
     * @param {luaparse.FunctionDeclaration} s 
     */
    const controlFlow = s => {
        var flat_ident = generateUniqueName();
        var function_decl = getRange(string, [s.range[0], s.body[0].range[0]], string);
        var local_variables = [];
        var waited_body = [];
        var idents = 0;
        var flattened_list = [];
        for(let i = 0; i < s.body.length; i++){
            flattened_list[idents] = flattened_list[idents] ?? "";
            let statement = s.body[i];
            if(statement.type == "ReturnStatement"){
                continue;
            }
            let next_statement = s.body[i + 1];
            if(statement.type == "LocalStatement"){
                statement.localStatement = true;
                let raw = getRange(string, [statement.range[0], statement.variables[statement.variables.length-1].range[1]], string);
                local_variables += `${raw}\n`;
                waited_body.push(statement);
            }
            else {
                let flattened_body = `
if ${flat_ident} == ${idents} then`;
                for(let j = 0; j < waited_body.length; j++){
                    let waited_statement = waited_body[j];
                    let raw = getRange(string, waited_statement.range, string);
                    if(waited_statement.localStatement){
                        raw = getRange(string, [waited_statement.variables[0].range[0], waited_statement.range[1]], string)
                    }
                    flattened_body += `
${raw}`;
                }
                flattened_list[idents] += flattened_body + "\n"
                let raw = getRange(string, statement.range, string);
                flattened_list[idents] += `
${raw}
`;
                if(next_statement && next_statement.type == "ReturnStatement"){
                    let raw = getRange(string, next_statement.range, string);
                    flattened_list[idents] += `
${raw}`;
                }
                else{
                    if(i != s.body.length - 1){
                        flattened_list[idents] += `
${flat_ident} = ${idents + 1}`
                    }
                    else{
                        flattened_list[idents] += `
break`    
                    }
                }
                flattened_list[idents] += `
end`;
                waited_body = [];
                idents++;
            }
        }
        flattened_list = flattened_list.sort(() => Math.random() - 0.5);
        var result = `${function_decl}
local ${flat_ident} = 0;
${local_variables}
while true do` + flattened_list.join("") + `
end
end
`;
        new_string = replaceRange(new_string, s.range, result, string)
    }
    luaparse.parse(string, {
        onCreateNode: async s => {
            if(s.type == "FunctionDeclaration")
                controlFlow(s)
        },
        ranges: true,
    })
    return new_string
}