const { readFileSync } = require('fs');
exports.security = (code) => {
    return readFileSync(__dirname + '/security.lua', 'utf-8') + "\n\n\n" + code;
}