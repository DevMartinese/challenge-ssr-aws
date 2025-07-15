const { commandMapper } = require('ebased/handler');
const inputMode = require('ebased/handler/input/commandApi');
const outputMode = require('ebased/handler/output/commandApi');

const domain = require('../domain');

module.exports.handler = async (command, context) => {
    return commandMapper({command, context}, inputMode, domain, outputMode);
};