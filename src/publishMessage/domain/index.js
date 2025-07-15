const publishMessageService = require('../service');

module.exports = async (eventPayload, eventMeta) => {
    const { event_id, channel, amount, currency, customer_id, timestamp } = eventPayload;

    // Validar el evento de entrada
    validatePaymentEvent(eventPayload);

    console.log(`🔄 Processing queued payment event: ${event_id} from channel: ${channel}`);

    await publishMessageService(eventPayload, eventMeta);
    
    const response = {
        event_id,
        channel,
        amount,
        currency,
        customer_id,
        timestamp,
        queued_at: new Date().toISOString(),
        status: 'queued_for_processing',
        lambda_name: eventMeta.source,
        message_id: eventMeta.messageId
    };

    console.log('✅ Queued event processing completed:', JSON.stringify(response, null, 2));
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

    console.log('✅ Queued event validation passed');
}