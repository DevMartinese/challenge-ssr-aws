const receiveMessageService = require('../service');
const { delay } = require('./utils');

module.exports = async (eventPayload, eventMeta) => {
    const startTime = Date.now();
    const { event_id, channel, amount, currency, customer_id, timestamp } = eventPayload;

    // Guardar evento original primero
    await receiveMessageService.saveOriginalEvent(eventPayload, eventMeta);

    let flowType = 'sync';

    // Lógica de negocio
    if (channel === 'qr-pct' && amount > 1000 && currency === 'ARS') {
        flowType = 'async';
        await receiveMessageService.processAsync(eventPayload, eventMeta);
    } else if (channel === 'qr-tctd') {
        await receiveMessageService.processSync(eventPayload, eventMeta);
    } else if (channel === 'link') {
        await delay(2000);
        await receiveMessageService.processSync(eventPayload, eventMeta);
    } else {
        await receiveMessageService.processSync(eventPayload, eventMeta);
    }

    // Log estructurado al final
    const processingTimeMs = Date.now() - startTime;
    console.log(JSON.stringify({
        lambda: 'ReceiveMessage',
        eventId: event_id,
        customerId: customer_id,
        timestamp,
        flowType,
        processingTimeMs
    }));

    return {
        body: {
            event_id,
            channel,
            amount,
            currency,
            customer_id,
            timestamp,
            processed_at: new Date().toISOString(),
            flow_type: flowType,
            lambda_name: eventMeta.source,
            processing_time_ms: processingTimeMs,
            status: 'processed'
        }
    };
}; 