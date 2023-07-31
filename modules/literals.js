var luaparse = require('luaparse');
const { readFileSync } = require('fs');
// const { compress } = require("./compress")
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
// const getAlphabetRange = (a, b) => {
//     let s = [];
//     for (let i = a.charCodeAt(0); i <= b.charCodeAt(0); i++)
//         s.push(String.fromCharCode(i));
//     return s;
// }
// const splitChars = getAlphabetRange("G", "T");

//array with characters that break the string
//for example \n \r " ' etc
// const breakChars = ["\n", "\r", "\"", "\'", "\\", "\t", "\b", "\f", "\v", "\0", "G", "X", "Z"];
const breakChars = ["\\", "G", "X", "Z", "[", "]"];
var original_literals_string = "";

const stringEncrypt = (a, b) => {
    let s = [];
    // for (let i = 0; i < a.length; i++){
    //     s.push((a.charCodeAt(i) ^ b.charCodeAt((i + 1) % b.length)).toString(16).toUpperCase());
    //     if(i != a.length - 1)
    //         s.push("G"); //splitChars[Math.floor(Math.random() * splitChars.length)]
    // }
    for (let i = 0; i < a.length; i++){
        let char = String.fromCharCode(a.charCodeAt(i) ^ 0x42);
        let encrypted_char_code = char.charCodeAt(0);
        if(breakChars.includes(char) || (encrypted_char_code >= 0 && encrypted_char_code <= 0x1F) || (encrypted_char_code == 0x7F)){
            //get the hex value of the char
            let hex = encrypted_char_code.toString(16).toUpperCase();
            //add a G to the end of the hex value
            //add the hex value to the string
            s.push("G" + hex + "G");
        }
        else{
            //add the char to the string
            s.push(char);
        }
        // if(i != a.length - 1)
        //     s.push("G");
    }
    return s.join("");
};
const { replaceRange, logCounter } = require('./misc');
const get_byte_size = (s) => Buffer.byteLength(s, 'utf8');
exports.protect_literals = (string, fn) => {
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
        onCreateNode: async s =>{
            var value = get_lua_string(s.raw);
            if(s.type == "StringLiteral" && value.length > 0){
                parse_literal(s, value)
            }
        },
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
    const update_counter = fn ? () => {} : logCounter(() => `Encrypted ${encrypted_count} literals!`);
    for(let type of ["StringLiteral", "NumericLiteral"]){
        encrypted[type] = [];
        for(let value in literal_obj[type]){
            let literal = literal_obj[type][value];
            encrypted_count++;
            original_literals_string += value;
            if(literal.index % 50 == 0)
                update_counter();
            add_literal(literal, value);
            if(type == "StringLiteral" && value.length == 0) continue;
            encrypted[type][literal.index-1] = stringEncrypt(value, xor_key); // xor_key + literal.index
            // console.log(`Encrypted ${type} ${value} to ${encrypted[type][literal.index-1]}`)
        }
        update_counter()
        encrypted[type] = encrypted[type].filter(a => a !== null);
    }
    if(!fn)
        console.log("")
    for(let type of ["NilLiteral", "BooleanLiteral"]){
        for(let value in literal_obj[type]){
            let literal = literal_obj[type][value];
            add_literal(literal, value)
        }
    }
    literals.sort((a, b) => a.range[0] - b.range[0])
    var protected_count = 0;
    const update_counter_protected = fn ? () => {} : logCounter(() => `Protected ${protected_count} literals!`);
    literals.forEach(l => {
        protected_count++;
        if(protected_count % 50 == 0) update_counter_protected();
        if(l.type == "StringLiteral" && l.value == "" && !fn){
            return result = replaceRange(result, l.range, `enc_literals[${encrypted_count}]`, string)
        }
        if(l.type == "NilLiteral" && !fn)
            return result = replaceRange(result, l.range, `enc_literals[${encrypted_count + 4}]`, string)
        if(l.type == "BooleanLiteral" && !fn)
            return result = replaceRange(result, l.range, `enc_literals[${encrypted_count + (l.value == "true" ? 3 : 2)}]`, string)
        
        if(l.type == "StringLiteral" || l.type == "NumericLiteral"){
            if(l.type == "NumericLiteral" && fn) return
            result = replaceRange(result, l.range, fn ? fn(l.value) : ` enc_literals[${l.index}] `, string)
        }
    })
    update_counter_protected()
    if(!fn){
        console.log("")
        var encrypted_string_uncompressed = `${encrypted["StringLiteral"].join("X")}Z${encrypted["NumericLiteral"].join("X")}`
        // console.log("Compressing literals...")
        var encrypted_string_compressed = encrypted_string_uncompressed//compress(encrypted_string_uncompressed)
        // var ratio = (get_byte_size(encrypted_string_compressed) / get_byte_size(encrypted_string_uncompressed)) * 100
        // console.log(`Compressed literals by ${ratio.toFixed(2)}%`)
        // console.log(`Original size: ${get_byte_size(original_literals_string)} bytes`)
        // console.log(`Uncompressed size: ${get_byte_size(encrypted_string_uncompressed)} bytes`)
        // console.log(`Compressed size: ${get_byte_size(encrypted_string_compressed)} bytes`)
        var encrypted_string = `([[${encrypted_string_compressed}]])`
        const encrypted_literals_encryption = readFileSync(__dirname + "/literals.lua", "utf-8");
        return [0x42, encrypted_string, encrypted_literals_encryption, result]
    }
    else{
        return result
    }
}