local raw_results = io.open("raw/results.txt", "r")
local protected_results = io.open("protected/results.txt", "r")
local raw_results_table = {}
local protected_results_table = {}

-- Read raw results
for line in raw_results:lines() do
    local name, time = line:match("^(.-)\t(.+)$")
    raw_results_table[name] = tonumber(time)
end
-- Read protected results
for line in protected_results:lines() do
    local name, time = line:match("^(.-)\t(.+)$")
    protected_results_table[name] = tonumber(time)
end
-- Calculate how many times slower protected is
local results = {}
for name, time in pairs(raw_results_table) do
    results[name] = protected_results_table[name] / time
end
-- Calculate the shortest tabulation length for the names
local max_name_length = 0
for name, _ in pairs(results) do
    if #name > max_name_length then
        max_name_length = #name
    end
end

function median(t)
    local n = #t
    if n % 2 == 1 then
        return t[(n + 1) / 2]
    else
        return (t[n / 2] + t[n / 2 + 1]) / 2
    end
end
function table.reduce(t, fn)
    local result = t[1]
    for i = 2, #t do
        result = fn(result, t[i])
    end
    return result
end
function table.values(t)
    local result = {}
    for _, v in pairs(t) do
        table.insert(result, v)
    end
    return result
end
function get_spacing(name)
    return string.rep(" ", math.floor(max_name_length - #name) + 4)
end

local print_results = {}
for name, time in pairs(results) do
    print_results[#print_results + 1] = string.format("%s%s%6.2f%% slower", name, get_spacing(name), math.max(0, (time - 1) * 100))
end
local max_name_print_length = 0
for _, line in ipairs(print_results) do
    if #line > max_name_print_length then
        max_name_print_length = #line
    end
end
print_results[#print_results+1] = "\n" .. string.rep("-", max_name_print_length)
do
    local name = "median"
    local val = median(table.values(results))
    local percentage = (val - 1) * 100
    print_results[#print_results+1] = string.format("%s%s%6.2f%% slower", name, get_spacing(name), percentage)
end
do
    local name = "average"
    local vals = table.values(results)
    local val = table.reduce(vals, function(a, b) return a + b end) / #table.values(results)
    local percentage = (val - 1) * 100
    print_results[#print_results+1] = string.format("%s%s%6.2f%% slower", name, get_spacing(name), percentage)
end

-- Print results
print("")
print(string.rep("-", max_name_print_length))
print("benchmark results")
print("(higher = worse)")
print(string.rep("-", max_name_print_length))
for _, line in ipairs(print_results) do
    print(line)
end
print(string.rep("-", max_name_print_length))
print("")
