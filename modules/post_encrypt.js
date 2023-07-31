const { protect_literals } = require('./literals');
const { protect_objects } = require('./objects');
const { protect_globals } = require('./globals');
const { protect_functions } = require('./functions');
const { thiscallproxy } = require('./thiscallproxy');
const encrypt = string => {
    var result = [];
    for(var i = 0; i < string.length; i++){
        result.push(string.charCodeAt(i) ^ 0x1);
    }
    return result.join(",");
}
const replace = (string, find, replace) => {
    var index = string.indexOf(find);
    if(index == -1)
        return string;
    return string.substr(0, index) + replace + string.substr(index + find.length);
}
exports.post_encrypt = (string, encrypted, key) => {
    var result = string + "";
    const encrypt_fn = `
local _string = ""
local __N = 32
local __P = 2^__N
local function __floor(x)
    return x - x % 1
end
local function __bxor(x, y)
	x, y = x % __P, y % __P
	local r = 0
	local p = 1
	for i = 1, __N do
		local a, b = x%2, y%2
		x, y = __floor(x/2), __floor(y/2)
		if a + b == 1 then
			r = r + p
		end
		p = 2 * p
	end
	return r
end
local __predecrypt = function(str_table)
    local result = ""
    for i = 1, #str_table do
        result = result .. _string.char(__bxor(str_table[i], 0x1))
    end
    return result
end

`;
    result = thiscallproxy(result, false)
    result = protect_functions(result, false)
    result = protect_globals(result, false)
    result = protect_objects(result, false)
    result = protect_literals(result, function(original){
        return `__predecrypt({${encrypt(original)}})`
    });
    //result.replace fails so we have to do this
    result = replace(result, "--@encrypted_string@", ` = ${encrypted}`);
    result = replace(result, "--@key@", ` = ${key}`);
    return encrypt_fn + result;
}