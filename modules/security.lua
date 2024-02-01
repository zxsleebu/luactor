local get_script_name = function()
    local info = debug.getinfo(1, "S")
    return info.source:match("([^\\]*)$"):sub(1, -5)
end
local log = function(text, text2)
    -- if text2 then
    --     text = text .. ": " .. text2
    -- end
    -- print(text)
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
    return ffi_table and
        (is_object_metatable_changed(ffi_table, false)
            or is_object_metatable_changed(ffi_table.C)
            or tostring(ffi_table.C):find("userdata") == nil)
end
local are_detecting_function_hooked = function ()
    return
    is_function_hooked(string.dump) or
    is_function_hooked(tostring) or
    is_function_hooked(type) or
    is_function_hooked(pairs) or
    is_function_hooked(debug.getinfo) or
    is_function_hooked(debug.getlocal)
end
local are_objs_changed = function(lite_functions)
    local globals = {}
    for k, v in pairs(_G) do
        globals[#globals+1] = v
    end
    local lite = {}
    for obj_name, o in pairs(lite_functions) do
        for fn_name, f in pairs(o) do
            if fn_name then
                lite[f] = true
            end
        end
    end
    for obj_name, o in pairs(globals) do
        if type(o) == "table" then
            for fn_name, f in pairs(o) do
                if type(f) == "function" and
                    fn_name:sub(1, 4) ~= "sol." and
                    fn_name:sub(1, 2) ~= "__" and
                    is_function_hooked(f, lite[f]) then
                    return true
                end
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
            {print, module, get_user_name, register_callback, find_pattern, create_interface, require},
            package, engine, entitylist, render, menu,
            client, globalvars, renderer, se, ragebot, ui, trace, clientstate
    }) then return false end
    check_started = true
    if is_script_required() then return false end
    return true
end
if is_function_hooked(pcall) or not pcall(check) or
    is_function_hooked(xpcall) or not xpcall(check, function() end) or
    not check() or not check_started then
    while true do end
    error("attempt to index a nil value")
end