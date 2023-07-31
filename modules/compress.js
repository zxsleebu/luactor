const fengari = require('fengari');
const lua = fengari.lua;
const lauxlib = fengari.lauxlib;
const lualib = fengari.lualib;
const L = lauxlib.luaL_newstate();
if (!L) throw Error("failed to create lua state");
lualib.luaL_openlibs(L);

const handle_call = (code) => {
    if(code == lua.LUA_ERRSYNTAX)
        throw Error("Syntax error");
    else if(code == lua.LUA_ERRMEM)
        throw Error("Memory allocation error");
    else if(code == lua.LUA_ERRRUN)
        throw new SyntaxError(lua.lua_tojsstring(L, -1));
    else if(code != lua.LUA_OK)
        throw Error("Unknown error: " + code);
}

//require compress.lua and run it
const compress_lua = require('fs').readFileSync(__dirname + '/compress.lua', 'utf8');
if(lauxlib.luaL_loadstring(L, fengari.to_luastring(compress_lua)) != lua.LUA_OK)
    throw Error("failed to load lua string");
let code = lua.lua_pcall(L, 0, 1, 0);
handle_call(code)

exports.compress = (string) => {
    lua.lua_getglobal(L, "compress");
    lua.lua_pushstring(L, fengari.to_luastring(string));
    code = lua.lua_pcall(L, 1, 1, 0);
    handle_call(code)
    const result = lua.lua_tojsstring(L, -1);
    lua.lua_pop(L, 1);
    return result;
}