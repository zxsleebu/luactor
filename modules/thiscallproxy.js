const { parse } = require('luaparse');
const { readFileSync } = require('fs');
const { replaceRange, getRange } = require('./misc');
exports.thiscallproxy = function(string, names){
    console.log('Protecting objects...');
    const thiscallproxy = readFileSync('./modules/thiscallproxy.lua', 'utf-8');
    var occurences = 0;
    var depth = 0;
    var data = [];
    var token = {}
    const get_depth = depth =>
        data[depth] || (data[depth] = {});
    const remove_depth = depth => data.splice(depth, 1);
    let thiscall_proxied = false;
    do{
        thiscall_proxied = false
        var parser = parse(string, {wait: true});
        var result = string + "";
        do {
            var s = parser.lex()
            if(s.type == 1) break; // EOF
            token.object_index = s.type == 32 && (s.value == "." || s.value == "[" || s.value == "]");
            token.thiscall = s.type == 32 && s.value == ":"
            token.variable = s.type == 8
            token.string = s.type == 2
            token.parentheses = s.type == 32 && (s.value == "(" || s.value == ")")
            token.control = s.type == 4
            token.assign = s.type == 32 && s.value == "="
            let d = get_depth(depth);
            let n = get_depth(depth + 1);
            remove_depth(depth + 2);
            if(token.parentheses && s.value == "(")
                depth++;
            if(token.parentheses && s.value == ")")
                depth--;
            // console.log(`${s.type} ${s.value}`)
            if(token.variable && d.is_indexing_object == d.is_indexing_by_string && !d.is_thiscall){
                d.is_variable = true;
                d.var_access_index = s.range[0];
                // console.log(`Accessing variable ${s.value} in line ${s.line}`)
            }
            if(token.assign){
                d.var_access_index = s.range[0] + 1;
            }
            if(d.is_indexing_object){
                d.is_indexing_object = false;
                d.is_indexing_by_string = false;
            }
            if(token.object_index){
                if(s.value == "."){
                    d.is_indexing_object = true;
                }
                if(s.value == "["){
                    n.is_indexing_object = true;
                    n.is_indexing_by_string = true;
                    depth++;
                }
                if(s.value == "]")
                    depth--;
            }
            if(token.thiscall){
                d.is_thiscall = true;
                d.thiscall_index = s.range[0];
            }
            if(d.wait_for_args){
                if(token.parentheses && s.value == ")"){ //remove commas if no args given
                    result = replaceRange(result, [s.range[0] - 2, s.range[1]], `)`, string);
                }
                d.wait_for_args = false;
                thiscall_proxied = true;
            }
            if(d.wait_for_thisptr && token.parentheses && s.value == "("){
                d.wait_for_thisptr = false;
                result = replaceRange(result, [s.range[0], s.range[1]], '', string);
                n.wait_for_args = true;
            }
            if(d.is_thiscall && token.variable){
                let obj = getRange(result, [d.var_access_index, s.range[0] - 1], string)
                // console.log(s.value)
                result = replaceRange(result, [d.var_access_index, s.range[0]], `lua__thiscall_proxy(${obj}, "${s.value}", `, string);
                result = replaceRange(result, [s.range[0], s.range[1]], '', string)
                d.wait_for_thisptr = true;
                d.is_thiscall = false;
                occurences++
            }
        } while (!thiscall_proxied && s.type != 1);
        string = result;
    }
    while(thiscall_proxied);
    console.log(`Proxied ${occurences} thiscalls!`);
    return thiscallproxy + "\n" + result
}
