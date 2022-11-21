var luaparse = require('luaparse');
const { replaceRange } = require('./misc');
exports.protect_globals = function(string){
    // console.log("Protecting globals...")
    var result = string + "";
    var globals = [];
    luaparse.parse(string, {
        onCreateNode: async s => {
            if(
                (s.type == "CallExpression" && s.base.name != s.base.identifier) ||
                (s.type == "MemberExpression")
                ){
                let root = s.base;
                while(root.base)
                    root = root.base;
                if(root?.isLocal != false) return;
                globals.push({name: root.name, range: root.range})
            }
            if(s.type == "AssignmentStatement"){
                s.variables.forEach(v => {
                    let root = v;
                    while(root.base)
                        root = root.base;
                    if(root?.isLocal != false) return;
                    if(root.type == "Identifier" && root?.isLocal == false)
                        globals.push({name: root.name, range: root.range})
                })
            }
        },
        ranges: true,
        scope: true,
    });
    var unduplicated = {}
    globals.sort((a, b) => a.range[0] - b.range[0]);
    globals.forEach(g => unduplicated[JSON.stringify(g.range)] = g.name)
    for(let range in unduplicated){
        result = replaceRange(result, JSON.parse(range), `_G["${unduplicated[range]}"]`, string)
    }
    console.log(`Protected ${globals.length} globals!`);
    return result
}