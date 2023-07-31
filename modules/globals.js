var luaparse = require('luaparse');
const { replaceRange, logCounter } = require('./misc');
exports.protect_globals = function(string, log){
    if(log === undefined) log = true;
    var result = string + "";
    var globals = [];
    const protect = async s => {
        if(s.body){
            s.body.forEach(async v => {
                if(v)
                    await protect(v);
            })
        }
        if(s.clauses){
            s.clauses.forEach(async v => {
                if(v.condition){
                    await protect(v.condition);
                }
            })
        }
        if(s.arguments){
            s.arguments.forEach(async v => {
                await protect(v);
            })
        }

        if((s.type == "CallExpression" && s.base.name != s.base.identifier) || (s.type == "MemberExpression")){
            let root = s.base;
            while(root.base)
                root = root.base;
            if(root?.isLocal != false) return;
            globals.push({name: root.name, range: root.range})
            occurences++
            if(occurences % 2 == 0) update_counter();
        }
        if(s.type == "CallExpression"){
            s.arguments.forEach(v => {
                let root = v;
                while(root.base)
                    root = root.base;
                if(root.type == "Identifier" && root?.isLocal == false){
                    globals.push({name: root.name, range: root.range})
                    occurences++
                    if(occurences % 2 == 0) update_counter();
                }
            })
            return;
        }
        if(s.type == "Identifier" && s?.isLocal == false){
            globals.push({name: s.name, range: s.range})
            occurences++
            if(occurences % 2 == 0) update_counter();
            return;
        }
        if(s.type == "TableValue" && s.value.type == "Identifier" && s.value?.isLocal == false){
            globals.push({name: s.value.name, range: s.value.range})
            occurences++
            if(occurences % 2 == 0) update_counter();
            return;
        }
        if(s.type == "AssignmentStatement"){
            s.variables.forEach(v => {
                let root = v;
                while(root.base)
                    root = root.base;
                if(root?.isLocal != false) return;
                if(root.type == "Identifier" && root?.isLocal == false){
                    globals.push({name: root.name, range: root.range})
                    occurences++
                    if(occurences % 2 == 0) update_counter();
                }
            })
            return;
        }
        if(s.type == "LocalStatement"){
            s.init.forEach(v => {
                let root = v;
                while(root.base)
                    root = root.base;
                if(root.type == "Identifier" && root?.isLocal == false){
                    globals.push({name: root.name, range: root.range})
                    occurences++
                    if(occurences % 2 == 0) update_counter();
                }
            })
            return;
        }
    }
    var occurences = 0;
    const global_var_name = "__luactor__global"
    const update_counter = log ? logCounter(() => `Protected ${occurences} global variables!`) : () => {};
    luaparse.parse(string, {
        onCreateNode: protect,
        ranges: true,
        scope: true,
    });
    update_counter()
    var unduplicated = {}
    globals.sort((a, b) => a.range[0] - b.range[0]);
    globals.forEach(g => unduplicated[JSON.stringify(g.range)] = g.name)
    for(let range in unduplicated){
        result = replaceRange(result, JSON.parse(range), `${global_var_name}["${unduplicated[range]}"]`, string)
    }
    if(log)
        console.log("")
    return `local ${global_var_name} = _G\n` + result
}