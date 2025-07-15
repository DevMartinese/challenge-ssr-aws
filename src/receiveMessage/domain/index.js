const { InputValidation } = require('ebased/schema/inputValidation');
const { delay } = require('./utils');
const receiveMessageService = require('../service');

module.exports = async (eventPayload, eventMeta) => {
    const startTime = Date.now();
    
    // Validar con ebased InputValidation
    new PaymentEventValidation(eventPayload, eventMeta).get();
    const { event_id, channel, amount, currency, customer_id, timestamp } = eventPayload;

    // Guardar evento original primero
    await receiveMessageService.saveOriginalEvent(eventPayload, eventMeta);

    let result;
    let flowType = 'sync';

    // Aplicar lógica de negocio según el canal
    if (channel === 'qr-pct' && amount > 1000 && currency === 'ARS') {
        // Flujo asíncrono - enviar a SQS
        flowType = 'async';
        result = await receiveMessageService.processAsync(eventPayload, eventMeta);
    } else if (channel === 'qr-tctd') {
        // Procesamiento directo
        result = await receiveMessageService.processSync(eventPayload, eventMeta);
    } else if (channel === 'link') {
        // Simular llamada externa (2 segundos)
        await delay(2000);
        result = await receiveMessageService.processSync(eventPayload, eventMeta);
    } else {
        // Procesamiento por defecto
        result = await receiveMessageService.processSync(eventPayload, eventMeta);
    }

    // Log estructurado al final
    const processingTimeMs = Date.now() - startTime;
    console.log(JSON.stringify({
        lambda: 'ReceiveMessage',
        eventId: event_id,
        flowType: flowType,
        processingTimeMs: processingTimeMs
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