local _string = ""
local string_char = _string.char
local string_sub = _string.sub
local _type = type
local table_concat = table.concat

local basedictcompress = {}
for i = 0, 255 do
    local ic, iic = string_char(i), string_char(i, 0)
    basedictcompress[ic] = iic
end
local function dictAddA(str, dict, a, b)
    if a >= 256 then
        a, b = 0, b+1
        if b >= 256 then
            dict = {}
            b = 1
        end
    end
    dict[str] = string_char(a, b)
    a = a+1
    return dict, a, b
end
---@param input string
function compress(input)
    if _type(input) ~= "string" then
        return nil, "string expected, got ".._type(input)
    end
    local len = #input
    if len <= 1 then
        return "u"..input
    end

    local dict = {}
    local a, b = 0, 1

    local result = {"c"}
    local resultlen = 1
    local n = 2
    local word = ""
    for i = 1, len do
        local c = string_sub(input, i, i)
        local wc = word..c
        if not (basedictcompress[wc] or dict[wc]) then
            local write = basedictcompress[word] or dict[word]
            if not write then
                return nil, "algorithm error, could not fetch word"
            end
            result[n] = write
            resultlen = resultlen + #write
            n = n+1
            if  len <= resultlen then
                return "u"..input
            end
            dict, a, b = dictAddA(wc, dict, a, b)
            word = c
        else
            word = wc
        end
    end
    result[n] = basedictcompress[word] or dict[word]
    resultlen = resultlen+#result[n]
    n = n+1
    if  len <= resultlen then
        return "u"..input
    end
    return table_concat(result)
end