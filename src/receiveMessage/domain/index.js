const { InputValidation } = require('ebased/schema/inputValidation');
const { Event } = require('ebased/schema/createEvent');
const receiveMessageService = require('../service');

module.exports = async (eventPayload, eventMeta) => {
    const { event_id, channel, amount, currency, customer_id, timestamp } = eventPayload;

    // Validar el evento de entrada
    new PaymentEventValidation(eventPayload, eventMeta).get();

    // Procesar según el canal
    let result;
    if (channel === 'qr-pct' && amount > 1000 && currency === 'ARS') {
        // Flujo asíncrono - enviar a SQS
        result = await receiveMessageService.processAsync(eventPayload, eventMeta);
    } else if (channel === 'qr-tctd') {
        // Procesamiento directo
        result = await receiveMessageService.processSync(eventPayload, eventMeta);
    } else if (channel === 'link') {
        // Simular llamada externa
        result = await receiveMessageService.processWithExternalCall(eventPayload, eventMeta);
    } else {
        // Procesamiento por defecto
        result = await receiveMessageService.processSync(eventPayload, eventMeta);
    }

    return {
        body: {
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
            status: 'processed'
        }
    };
};

class PaymentEventValidation extends InputValidation {
    constructor(payload, meta) {
        super({
            type: 'PAYMENT.EVENT.RECEIVED',
            specversion: 'v1.0.0',
            source: meta.source,
            payload: payload,
            schema: {
                event_id: { type: String, required: true },
                channel: { 
                    type: String, 
                    required: true,
                    enum: ['qr-pct', 'qr-tctd', 'link']
                },
                amount: { type: Number, required: true, min: 0 },
                currency: { 
                    type: String, 
                    required: true,
                    enum: ['ARS', 'USD']
                },
                customer_id: { type: String, required: true },
                timestamp: { type: String, required: true }
            }
        });
    }
} 