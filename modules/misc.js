exports.replaceRange = (s, range, repl, original) => {
    let offset = original.length - s.length
    return s.substring(0, range[0] - offset) + repl + s.substring(range[1] - offset);
}
exports.getRange = (s, range, original) => {
    let offset = original.length - s.length
    return s.substring(range[0] - offset, range[1] - offset);
}
exports.logCounter = (get_string) => () => {
    process.stdout.cursorTo(0);
    process.stdout.write(get_string());
}