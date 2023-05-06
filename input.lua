function test()
    local N = tonumber(arg and arg[1]) or 0
    local mindepth = 4
    local maxdepth = mindepth + 2
    if maxdepth < N then maxdepth = N end
    local longlivedtree = BottomUpTree(0, maxdepth)
    for depth = mindepth, maxdepth, 2 do
        local iterations = 2 ^ (maxdepth - depth + mindepth)
        local check = 0
        for i = 1, iterations do
            check = check + ItemCheck(BottomUpTree(1, depth)) +
                ItemCheck(BottomUpTree(-1, depth))
        end
        io.write(string.format("%d\t trees of depth %d\t check: %d\n",
            iterations * 2, depth, check))
    end
    io.write(string.format("long lived tree of depth %d\t check: %d\n",
        maxdepth, ItemCheck(longlivedtree)))
end
