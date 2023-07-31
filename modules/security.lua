local get_script_name = function()
    local info = debug.getinfo(1, "S")
    return info.source:match("([^\\]*)$"):sub(1, -5)
end
local is_script_required = function()
    local info = debug.getinfo(1, "S")
    local script_name = get_script_name()
    local is_in_lua_folder = info.source:find("\\lua\\") ~= nil
    local is_in_packages = package.loaded[script_name] ~= nil
    local _, error_message = pcall(debug.getlocal, -1, 1)
    return is_in_lua_folder or is_in_packages or error_message:find("bad argument") == nil
end
local is_function_hooked = function(f, lite)
    if pcall(string.dump, f) then return true end
    if not lite and not tostring(f):find("#") then return true end
    if debug.getinfo(f).what ~= "C" then return true end
    return false
end
local is_object_metatable_changed = function(obj, check_nil)
    if check_nil == nil then check_nil = true end
    local metatable = getmetatable(obj)
    if metatable == nil then return check_nil end
    return is_function_hooked(metatable.__index)
end
local is_ffi_hooked = function(ffi_table)
    return ffi_table and (is_object_metatable_changed(ffi_table, false) or is_object_metatable_changed(ffi_table.C) or tostring(ffi_table.C):find("userdata") == nil)
end
local are_detecting_function_hooked = function ()
    return
    is_function_hooked(string.dump) or
    is_function_hooked(pcall) or
    is_function_hooked(tostring) or
    is_function_hooked(type) or
    is_function_hooked(pairs) or
    is_function_hooked(debug.getinfo) or
    is_function_hooked(debug.getlocal)
end
local are_objs_changed = function(obj, lite)
    for obj_name, o in pairs(obj) do
        for fn_name, f in pairs(o) do
            if type(f) == "function" and is_function_hooked(f, lite) then
                return true
            end
        end
    end
end
local check_started = false
local check = function()
    if is_ffi_hooked(require("ffi")) then return false end
    if is_ffi_hooked(ffi) then return false end
    if is_object_metatable_changed(debug, false) then return false end
    if are_detecting_function_hooked() then return false end
    if are_objs_changed({
        client, globalvars, debug, engine, io, ffi, os, string, jit, table, bit, coroutine, jit,
        {
            pcall, xpcall,
            loadstring, load, loadfile, dofile,
            unpack, select, next, ipairs, assert, error, print,
            getmetatable, setmetatable,
            setfenv, getfenv,
            rawget, rawset, rawequal, rawlen,
            collectgarbage,
            tonumber, register_callback
        }
    }) then return false end
    check_started = true
    if are_objs_changed({package}, true) then return false end
    if is_script_required() then return false end
    return true
end
if not check() or not check_started then error("hello") end