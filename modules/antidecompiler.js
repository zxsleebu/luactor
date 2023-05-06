const { readFileSync } = require('fs');
const taunts = [
    "crack = gay",
    "$$$ luactor protector technologies $$$",
    "$$$ ultra mega private obfuscator $$$",
    "closethisfuckingfileyounigga",
    "stop scrolling thru the fucking code you faggot",
    "i recommend you to go to scroll your father's balls",
    "you're still not good enough to crack this",
    "not enough iq even to decrypt the strings?",
    "sadly you will not find anything interesting in here",
    "you should really go jump of the cliff",
    "mox eax, eax",
    "debug = nil",
    'if cracked then execute("exit") end',
    'come here you stinky little pervert',
    "#STOPWAR"
]
const bytecode_symbols = [
    "", "", "�", "", "", "4", "6", "/", "2", "T", " ", "I", "(", "", "", "�(", "@", ";", "�(\0\0T", "\0v�\0&\0\0"
]
const generateRandomSymbols = function(){
    let random_symbols = "";
    let new_lines_count = Math.floor(Math.random() * 10);
    for(let a = 0; a < new_lines_count; a++){
        let random_symbols_count = Math.floor(Math.random() * 30 - 1);
        for(let i = 0; i < random_symbols_count; i++){
            random_symbols += bytecode_symbols[Math.floor(Math.random() * bytecode_symbols.length)]
        }
        if(a != new_lines_count - 1)
            random_symbols += "\\n";
    }
    return random_symbols
}
exports.antidecompiler = function(string){
    console.log("Injecting anti-decompiler...");
    const strings = {
        UPPER: ' ',//`upper string`,
        BOTTOM: 'HELLO FROM LUACTOR TECHNOLOGIES',//`bottom string`,
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
    let random_taunts = {};
    //get 5 unique taunts
    while(Object.keys(random_taunts).length < 5){
        let taunt = taunts[Math.floor(Math.random() * taunts.length)];
        random_taunts[taunt] = true;
    }
    let taunt_string = "";
    for(let taunt in random_taunts){
        let quote = taunt.includes('"') ? "'" : '"';
        //generate random symbols that look like bytecode
        let random_symbols = generateRandomSymbols(true);
        let random_symbols_after = generateRandomSymbols(true);
        taunt_string += `${quote}${random_symbols} ${taunt} ${random_symbols_after}${quote},\n`
    }
    antidec = antidec.replace("--taunts", taunt_string);
    string = antidec + "\n".repeat(100) + string;
    return string; 
}