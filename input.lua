local hello = {
    bool = true
}
function hello:test()
    print(self.bool)
end
hello:test()