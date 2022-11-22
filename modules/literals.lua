do
    local function char(val)
        local c = string.char
        local bm = { { 0x7FF, 192 }, { 0xFFFF, 224 }, { 0x1FFFFF, 240 } }
        if val < 128 then return c(val) end
        local cbts = {}
        for bts, vals in ipairs(bm) do
            if val <= vals[1] then
                for b = bts + 1, 2, -1 do
                    local mod = val % 64
                    val = (val - mod) / 64
                    cbts[b] = c(128 + mod)
                end
                cbts[1] = c(vals[2] + val)
                break
            end
        end
        return table.concat(cbts)
    end
    local function dec(str, key)
        local c = 0
        return str:gsub("[G]-([0-9A-F]+)", function(a)
            c = c + 1
            return char(bit.bxor(tonumber(a, 16), key:byte(c % #key + 1)))
        end)
    end
    ---@diagnostic disable: undefined-global
    local c, is_number = 1, false
    encrypted_string:gsub("([^Z]+)", function(a)
        a:gsub("([^X]+)", function(s)
            enc_literals[c] = dec(s, "@XOR_KEY@" .. tostring(c))
            if is_number then
                enc_literals[c] = tonumber(enc_literals[c])
            end
            c = c + 1
        end)
        is_number = true
    end)
    enc_literals[c] = "" --"" 0
    enc_literals[c + 1] = not not (enc_literals[#enc_literals] == nil) --false 1
    enc_literals[#enc_literals + 1] = pcall(function() end) --true 2
end
