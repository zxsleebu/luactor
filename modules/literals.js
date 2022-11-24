var luaparse = require('luaparse');
const { readFileSync } = require('fs');
const stringEcnrypt = (a, b) => {
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
    const parse_literal = (s, index) => {
        if(!literal_obj[s.type]) literal_obj[s.type] = {};
        let obj = literal_obj[s.type];
        if(!obj[s.value])
            obj[s.value] = {
                index: literal_index++,
                ranges: [],
                type: s.type
            };
        obj[s.value].ranges.push(s.range);
    }
    luaparse.parse(string, {
        onCreateNode: async s => 
            (s.type == "StringLiteral" && s.value.length > 0) && parse_literal(s),
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
            encrypted[type][literal.index-1] = stringEcnrypt(value, xor_key + literal.index);
        }
        update_counter()
        // encrypted[type] = encrypted[type].filter(a => a !== null);
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
    result = readFileSync("./modules/literals.lua", "utf-8").replaceAll("@XOR_KEY@", xor_key) + result;
    result = `local enc_literals = {}\n` + result.replace("encrypted_string", encrypted_string)
    console.log("")
    return result;
}