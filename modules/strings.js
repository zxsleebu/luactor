const { parse } = require('luaparse');
const { readFileSync } = require('fs');
const stringEcnrypt = (a, b) => {
    let s = [];
    for (let i = 0; i < a.length; i++)
        s.push((a.charCodeAt(i) ^ b.charCodeAt((i + 1) % b.length)).toString(16).toUpperCase())
    return s.join("G")
};
const replaceRange = (s, start, end, repl) => s.substring(0, start) + repl + s.substring(end);
exports.protect_strings = string => {
    // console.log("Protecting strings...");
    string = string.replaceAll(/((\[\[)([\s\S]+?|)(\]\]))/g, (match, p1) => {
        return `(${p1})`
    })
    var parser = parse(string, { wait: true });
    var strings = [], ranges = [], index = 0, result = string + "";
    const var_name = "enc_strings";
    const xor_key = "42G41G5DG5BG42";
    var decryptor_lua = readFileSync("./modules/strings.lua", "utf-8").replaceAll("@XOR_KEY@", xor_key);
    do {
        var s = parser.lex()
        if (s.type == 1) break;
        if (s.type != 2) continue;
        if (!strings.find(x => x.value == s.value))
            strings.push({ value: s.value, index: index++, string: stringEcnrypt(s.value, xor_key + index) });
        ranges.push([s.range, s.value]);
    } while (s.type != 1);

    for (obj of ranges) {
        var range = obj[0], value = obj[1];
        var s = strings.find(x => x.value == value);
        var offset = string.length - result.length;
        result = replaceRange(result, range[0] - offset, range[1] - offset, " " + var_name + "[" + (s.index + 1) + "] ");
    }
    var encstr = `local ${var_name} = {`
    var sorted_strings = [];
    for (s of strings) {
        sorted_strings[s.index] = s.string;
    }
    for (i = 0; i < sorted_strings.length; i++)
        encstr += `"${sorted_strings[i]}",`
    encstr += "}\n"
    console.log(`Protected ${ranges.length} strings!`);
    return encstr + decryptor_lua + result;
}