const { readFileSync } = require('fs');
exports.security = (code) => {
    return readFileSync('./modules/security.lua', 'utf-8') + "\n\n\n" + code;
}