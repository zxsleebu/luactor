local string = "([^X]+)"
--get charcodes from string
local charcodes = {}
for i = 1, #string do
    charcodes[i] = string.byte(string, i)
end
print(table.concat(charcodes, ", "))