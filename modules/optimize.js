const {parse} = require('luaparse');
const optimization = {
    math: {
        cos: true,
        sin: true,
        asin: true,
        atan2: true,
        normalize_yaw: false,
        rad2deg: false,
        deg2rad: false,
        round: false,
    }
}
exports.optimize = string => {
    console.log("Optimizing...")
    var defs = [[], []]
    for(table in optimization){
        for(func in optimization[table]){
            if(optimization[table][func] == false)
                string = string.replaceAll(table + "." + func + " =", "local " + func + " =")
            else{
                defs[0].push(func)
                defs[1].push(table + "." + func) 
            }
            string = string.replaceAll(table + "." + func, func)
        }
    }
    string = "\nlocal " + defs[0].join(", ") + " = " + defs[1].join(", ") + "\n" + string
    return string
}