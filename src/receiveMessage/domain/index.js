const receiveMessageService = require('../service');

module.exports = async (eventPayload, eventMeta) => {
    const { event_id, channel, amount, currency, customer_id, timestamp } = eventPayload;

    // Validar el evento de entrada
    validatePaymentEvent(eventPayload);

    console.log(`🔄 Processing payment event: ${event_id} from channel: ${channel}`);

    // Procesar según el canal
    let result;
    if (channel === 'qr-pct' && amount > 1000 && currency === 'ARS') {
        console.log('📤 Sending to async flow (SQS)');
        result = await receiveMessageService.processAsync(eventPayload, eventMeta);
    } else if (channel === 'qr-tctd') {
        console.log('⚡ Processing directly (sync)');
        result = await receiveMessageService.processSync(eventPayload, eventMeta);
    } else if (channel === 'link') {
        console.log('🌐 Processing with external call simulation');
        result = await receiveMessageService.processWithExternalCall(eventPayload, eventMeta);
    } else {
        console.log('🔄 Processing with default flow');
        result = await receiveMessageService.processSync(eventPayload, eventMeta);
    }

    const response = {
        event_id,
        channel,
        amount,
        currency,
        customer_id,
        timestamp,
        processed_at: new Date().toISOString(),
        flow_type: channel === 'qr-pct' && amount > 1000 && currency === 'ARS' ? 'async' : 'sync',
        lambda_name: eventMeta.source,
        processing_time_ms: result.processingTime,
        status: 'processed',
        message_id: eventMeta.messageId
    };

    console.log('✅ Domain processing completed:', JSON.stringify(response, null, 2));
    return response;
};

function validatePaymentEvent(payload) {
    const requiredFields = ['event_id', 'channel', 'amount', 'currency', 'customer_id', 'timestamp'];
    const validChannels = ['qr-pct', 'qr-tctd', 'link'];
    const validCurrencies = ['ARS', 'USD'];

    // Validar campos requeridos
    for (const field of requiredFields) {
        if (!payload[field]) {
            throw new Error(`Missing required field: ${field}`);
        }
    }

    // Validar canal
    if (!validChannels.includes(payload.channel)) {
        throw new Error(`Invalid channel: ${payload.channel}. Must be one of: ${validChannels.join(', ')}`);
    }

    // Validar moneda
    if (!validCurrencies.includes(payload.currency)) {
        throw new Error(`Invalid currency: ${payload.currency}. Must be one of: ${validCurrencies.join(', ')}`);
    }

    // Validar monto
    if (typeof payload.amount !== 'number' || payload.amount < 0) {
        throw new Error(`Invalid amount: ${payload.amount}. Must be a positive number`);
    }

    // Validar timestamp
    if (isNaN(Date.parse(payload.timestamp))) {
        throw new Error(`Invalid timestamp: ${payload.timestamp}`);
    }

    console.log('✅ Event validation passed');
} 