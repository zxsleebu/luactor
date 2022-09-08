exports.antidecompiler = function(string){
    console.log("Injecting anti-decompiler...");
    const crack_notice = `don't try to crack our script. you will ruin the market`
    const repeat_count = 150;
    string = ` 
ptc___storm = [[БЛЯ. НУ ПОДУМАЙ. ОСТАНОВИСЬ. ТЕБЕ ЭТО НЕ НАДО. ПРОШУ
столько времени было потрачено на создание действительно хорошего скрипта.
из-за чей-то шалости всё уйдёт коту под cхвост. пожалуйста. не забирай у бедного беженца из украины деньги на жизнь
]] or pcall(function(test)
    local ptc___storm = function() return [[\n\n\nwe are storm.lua. ${crack_notice}\n\nthis script has all the potential to kill the market of paid scripts. so, please, leave it alone.
stop being gay. our developer team spent so much time on this script.
give developers some money. they deserve it.
\nlinius, не крякай пж. подумой.\n\nпрошу всех уважаемых реверсеров сохранить рынок платных и бесплатных скриптов.
также мы очень хотим покушать, так что пж, закрой скрипт, и пойди подрочи. это будет лучшим вариантом.
${"\n".repeat(1000)}]] end and function(a) return false${" and 0ULL".repeat(repeat_count)} end
    repeat
        ptc___storm()
    until(test and
        (ptc___storm{DontDecompileMe = 1ULL, ["  i will ask another time. please, "] = [[\n${crack_notice}\n\n]]} and
        false ${" or 0ULL".repeat(repeat_count)}))
end, false) or [[${"\n".repeat(100)}]]${" or 1ULL".repeat(repeat_count)} ` + string;
console.log("Injected anti-decompiler!");
    return string; 
}