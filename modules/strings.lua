do
    local function char(val)
        local bm = { { 0x7FF, 192 }, { 0xFFFF, 224 }, { 0x1FFFFF, 240 } }
        if val < 128 then return string.char(val) end
        local cbts = {}
        for bts, vals in ipairs(bm) do
            if val <= vals[1] then
                for b = bts + 1, 2, -1 do
                    local mod = val % 64
                    val = (val - mod) / 64
                    cbts[b] = string.char(128 + mod)
                end
                cbts[1] = string.char(vals[2] + val)
                break
            end
        end
        return table.concat(cbts)
    end
    local function bxor(x, y)
        x, y = x % 0x100000000, y % 0x100000000
        local r = 0
        local p = 1
        for _ = 1, 32 do
            local a, b = x % 2, y % 2
            x, y = math.floor(x / 2), math.floor(y / 2)
            if a + b == 1 then
                r = r + p
            end
            p = 2 * p
        end
        return r
    end
    local function dec(str, key)
        local c = 0
        return str:gsub("[G]-([0-9A-F]+)", function(a)
            c = c + 1
            return char(bxor(tonumber(a, 16), key:byte(c % #key + 1)))
        end)
    end
    ---@diagnostic disable: undefined-global
    for c = 1, #enc_strings do
        enc_strings[c] = dec(enc_strings[c], "@XOR_KEY@" .. tostring(c))
    end
end
