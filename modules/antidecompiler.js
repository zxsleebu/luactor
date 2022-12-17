const { readFileSync } = require('fs');
exports.antidecompiler = function(string){
    console.log("Injecting anti-decompiler...");
    const strings = {
        UPPER: ' ',//`upper string`,
        BOTTOM: ' ',//`bottom string`,
    }
    const repeat_count = 300;
    const zeroull = "(" + "0ULL and ".repeat(repeat_count) + "0ULL)";
    const oneull = "(" + "0xffffffffffffffff or ".repeat(repeat_count) + "1ULL)";
    var antidec = readFileSync(__dirname + "/antidecompiler.lua", "utf-8");
    antidec = antidec.replaceAll("0ULL", zeroull)
    antidec = antidec.replaceAll("1ULL", oneull)
    antidec = antidec.replace(/@[A-Z_]+?@/g, match => {
        const name = match.slice(1, -1)
        if(strings[name])
            return strings[name]
    })
    string = antidec + "\n".repeat(100) + string;
    return string; 
}