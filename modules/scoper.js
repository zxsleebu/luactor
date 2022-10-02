exports.scoper = function(string){
    console.log("Scoped script to a local scope!");
    return `

local trigger_once = false
repeat
    trigger_once = true
    if trigger_once then
        ${string}
    end
until(trigger_once)
`
}