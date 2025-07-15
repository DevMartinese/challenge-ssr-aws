const { batchEventMapper } = require('ebased/handler');
const inputMode = require('ebased/handler/input/batchEventQueue');
const outputMode = require('ebased/handler/output/batchEventConfirmation');

const domain = require('../domain');

module.exports.handler = async (eventPayload,  eventMeta) => {
    return batchEventMapper({eventPayload, eventMeta}, inputMode, domain, outputMode);
};