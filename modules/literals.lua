local enc_literals = {}
do
    local encrypted--@encrypted_string@
    local key--@key@
    local _string = ""
    local string_char = _string.char
    local string_gsub = _string.gsub
    local string_byte = _string.byte
    -- local string_sub = _string.sub
    local bit_bxor = bit.bxor
    local _ipairs = ipairs
    local _tonumber = tonumber
    -- local _type = type
    local table_concat = table.concat
    local function get_char(val)
        local bm = { { 0x7FF, 192 }, { 0xFFFF, 224 }, { 0x1FFFFF, 240 } }
        if val < 128 then return string_char(val) end
        local cbts = {}
        for bts, vals in _ipairs(bm) do
            if val <= vals[1] then
                for b = bts + 1, 2, -1 do
                    local mod = val % 64
                    val = (val - mod) / 64
                    cbts[b] = string_char(128 + mod)
                end
                cbts[1] = string_char(vals[2] + val)
                break
            end
        end
        return table_concat(cbts)
    end
    ---@param char string
    local get_byte = function(char)
        local c = 0
        local bytes = { string_byte(char, 1, -1) }
        for _, v in _ipairs(bytes) do
            if v > 127 then
                c = (c * 64) + (v % 64)
            else
                c = v
                break
            end
        end
        return c
    end
    ---@param byte number
    ---@return string
    local decrypt = function(byte)
        return get_char(bit_bxor(byte, key))
    end
    local current_index = 1
    local is_number = false
    local escape_pattern = loadstring('return "[%z\\1-\\127\\194-\\244][\\128-\\191]*"')()
    local _ = string_gsub(encrypted, "[^Z]+", function(typed_string_list)
        local _ = string_gsub(typed_string_list, "[^X]+", function(typed_string)
            local value = typed_string
            --unescape characters
            value = string_gsub(value, "[G]([0-9A-F]+)[G]", function(encrypted_hex)
                return get_char(_tonumber(encrypted_hex, 16))
            end)
            --map unicode characters and decrypt them
            value = string_gsub(value, escape_pattern, function(encrypted_char)
                return decrypt(get_byte(encrypted_char))
            end)
            if is_number then
                value = _tonumber(value)
            end
            enc_literals[current_index] = value
            current_index = current_index + 1
        end)
        is_number = true
    end)
    enc_literals[current_index] = "" --"" 0
    enc_literals[current_index + 1] = not not (enc_literals[#enc_literals] == nil) --false 1
    enc_literals[#enc_literals + 1] = pcall(function() end) --true 2
end


