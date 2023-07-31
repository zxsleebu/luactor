do
    local char_code = string.char
    local decrypt_charcode = function(str)
        local decrypted = "";
        for i = 1, #str do
            decrypted = decrypted .. char_code(str[i])
        end
        return decrypted
    end
    local get_var = function(parent, name)
        return parent[decrypt_charcode(name)]
    end
    local _ipairs = get_var(_G, {105, 112, 97, 105, 114, 115})
    local _table = get_var(_G, {116, 97, 98, 108, 101})
    local table_concat = get_var(_table, {99, 111, 110, 99, 97, 116})
    local _bit = get_var(_G, {98, 105, 116})
    local bit_bxor = get_var(_bit, {98, 120, 111, 114})
    local _tonumber = get_var(_G, {116, 111, 110, 117, 109, 98, 101, 114})
    local _string = get_var(_G, {115, 116, 114, 105, 110, 103})
    local string_byte = get_var(_string, {98, 121, 116, 101})
    local string_gsub = get_var(_string, {103, 115, 117, 98})
    local _tostring = get_var(_G, {116, 111, 115, 116, 114, 105, 110, 103})
    local _pcall = get_var(_G, {112, 99, 97, 108, 108})
    local function char(val)
        local bm = { { 0x7FF, 192 }, { 0xFFFF, 224 }, { 0x1FFFFF, 240 } }
        if val < 128 then return char_code(val) end
        local cbts = {}
        for bts, vals in _ipairs(bm) do
            if val <= vals[1] then
                for b = bts + 1, 2, -1 do
                    local mod = val % 64
                    val = (val - mod) / 64
                    cbts[b] = char_code(128 + mod)
                end
                cbts[1] = char_code(vals[2] + val)
                break
            end
        end
        return table_concat(cbts)
    end
    local dec_pattern = decrypt_charcode({91, 71, 45, 84, 93, 45, 40, 91, 48, 45, 57, 65, 45, 70, 93, 43, 41}) --[G-T]-([0-9A-F]+)
    local function dec(str, key)
        local c = 0
        return string_gsub(str, dec_pattern, function(a)
            c = c + 1
            return char(bit_bxor(_tonumber(a, 16), string_byte(key, c % #key + 1)))
        end)
    end
    ---@diagnostic disable: undefined-global
    local c, is_number = 1, false
    local split_pattern = decrypt_charcode({40, 91, 94, 90, 93, 43, 41}) --([^Z]+)
    local split_types_pattern = decrypt_charcode({40, 91, 94, 88, 93, 43, 41}) --([^X]+)
    string_gsub(encrypted_string, split_pattern, function(a)
        string_gsub(a, split_types_pattern, function(s)
            enc_literals[c] = dec(s, "@XOR_KEY@" .. _tostring(c))
            if is_number then
                enc_literals[c] = _tonumber(enc_literals[c])
            end
            c = c + 1
        end)
        is_number = true
    end)
    enc_literals[c] = "" --"" 0
    enc_literals[c + 1] = not not (enc_literals[#enc_literals] == nil) --false 1
    enc_literals[#enc_literals + 1] = _pcall(function() end) --true 2
end
