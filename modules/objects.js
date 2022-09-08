const {parse} = require('luaparse');
const replaceRange = (s, start, end, repl) => {
    return s.substring(0, start) + repl + s.substring(end);
}
exports.protect_objects = function(string, names){
    console.log('Protecting objects...');
    var parser = parse(string, {wait: true});
    var stage = 0, result = string + "";
    do {
        var s = parser.lex()
        if(s.type == 1) break;
        if(stage == 0)
            s.type == 8 && names[s.value] ? stage++ : stage = 0;
        else if(stage == 1)
            s.type == 32 && s.value == "." ? stage++ : stage = 0;
        else if(stage == 2 && s.type == 8){
            var offset = string.length - result.length;
            result = replaceRange(result, s.range[0] - offset - 1, s.range[1] - offset, `["${s.value}"]`);
            stage = 0;
        }
    } while (s.type != 1);
    for (obj_name in names){
        (names[obj_name] == 1) &&
        (result = result.replaceAll(obj_name, obj_name.substring(0, 3)));
    }
    console.log("Protected objects!");
    return result
}