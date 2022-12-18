var luaparse = require('luaparse');
const { readFileSync } = require('fs');
const fengari = require('fengari');
const lua = fengari.lua;
const lauxlib = fengari.lauxlib;
const lualib = fengari.lualib;
const L = lauxlib.luaL_newstate();
if (!L) throw Error("failed to create lua state");
lualib.luaL_openlibs(L);
const get_lua_string = (str) => {
    if(lauxlib.luaL_loadstring(L, fengari.to_luastring(`return ${str}`)) != lua.LUA_OK)
    throw Error("failed to load lua string");
    if(lua.lua_pcall(L, 0, 1, 0) != lua.LUA_OK)
        throw Error("failed to run lua code");
    const result = lua.lua_tojsstring(L, -1);
    lua.lua_pop(L, 1);
    return result;
}

const stringEncrypt = (a, b) => {
    let s = [];
    for (let i = 0; i < a.length; i++)
        s.push((a.charCodeAt(i) ^ b.charCodeAt((i + 1) % b.length)).toString(16).toUpperCase())
    return s.join("G")
};
const { replaceRange, logCounter } = require('./misc');
exports.protect_literals = string => {
    const xor_key = "42G41G5DG5BG42";
    string = string.replaceAll(/((\[\[)([\s\S]+?|)(\]\]))/g, (match, p1) => `(${p1})`)
    var result = string + "";
    var literal_obj = {};
    var literal_index = 1;
    const parse_literal = (s, value) => {
        value = value || s.value;
        if(!literal_obj[s.type]) literal_obj[s.type] = {};
        let obj = literal_obj[s.type];
        if(!obj[value])
            obj[value] = {
                index: literal_index++,
                ranges: [],
                type: s.type
            };
        obj[value].ranges.push(s.range);
    }
    luaparse.parse(string, {
        onCreateNode: async s => 
            (s.type == "StringLiteral" && s.value.length > 0) && parse_literal(s, get_lua_string(s.raw)),
        ranges: true,
    })
    luaparse.parse(string, {
        onCreateNode: async s =>
            (s.type == "NumericLiteral") && parse_literal(s),
        ranges: true,
    })
    luaparse.parse(string, {
        onCreateNode: async s =>
            (["NilLiteral", "BooleanLiteral"].includes(s.type)) && parse_literal(s),
        ranges: true,
    })
    // luaparse.parse(string, {
    //     onCreateNode: async s =>
    //         (s.type == "StringLiteral" && s.value.length == 0) && parse_literal(s),
    //     ranges: true,
    // })
    var literals = [];

    var encrypted = {};
    var encrypted_count = 0;
    const add_literal = (literal, value) => 
        literal.ranges.forEach(range =>
            literals.push({
                value: value,
                range: range,
                index: literal.index,
                type: literal.type
            })
        )
    const update_counter = logCounter(() => `Encrypted ${encrypted_count} literals!`);
    for(let type of ["StringLiteral", "NumericLiteral"]){
        encrypted[type] = [];
        for(let value in literal_obj[type]){
            let literal = literal_obj[type][value];
            encrypted_count++;
            if(literal.index % 3 == 0) update_counter();
            add_literal(literal, value);
            if(type == "StringLiteral" && value.length == 0) continue;
            encrypted[type][literal.index-1] = stringEncrypt(value, xor_key + literal.index);
        }
        update_counter()
        encrypted[type] = encrypted[type].filter(a => a !== null);
    }
    console.log("")
    for(let type of ["NilLiteral", "BooleanLiteral"]){
        for(let value in literal_obj[type]){
            let literal = literal_obj[type][value];
            add_literal(literal, value)
        }
    }
    literals.sort((a, b) => a.range[0] - b.range[0])
    var protected_count = 0;
    const update_counter_protected = logCounter(() => `Protected ${protected_count} literals!`);
    literals.forEach(l => {
        protected_count++;
        if(protected_count % 9 == 0) update_counter_protected();
        if(l.type == "StringLiteral" && l.value == "")
            return result = replaceRange(result, l.range, `enc_literals[${encrypted_count}]`, string)
        if(l.type == "NilLiteral")
            return result = replaceRange(result, l.range, `enc_literals[${encrypted_count + 4}]`, string)
        if(l.type == "BooleanLiteral")
            return result = replaceRange(result, l.range, `enc_literals[${encrypted_count + (l.value == "true" ? 3 : 2)}]`, string)
        
        if(l.type == "StringLiteral" || l.type == "NumericLiteral")
            result = replaceRange(result, l.range, ` enc_literals[${l.index}] `, string)
    })
    update_counter_protected()
    var encrypted_string = `("${encrypted["StringLiteral"].join("X")}Z${encrypted["NumericLiteral"].join("X")}")`
    result = readFileSync(__dirname + "/literals.lua", "utf-8").replaceAll("@XOR_KEY@", xor_key) + result;
    result = `local enc_literals = {}\n` + result.replace("encrypted_string", encrypted_string)
    console.log("")
    return result;
}