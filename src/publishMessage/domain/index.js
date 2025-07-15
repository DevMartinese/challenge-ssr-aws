const { InputValidation } = require('ebased/schema/inputValidation');
const publishMessageService = require('../service');

module.exports = async (commandPayload, commandMeta) => {
    new PaymentEventValidation(commandPayload, commandMeta).get();
    await publishMessageService(commandPayload, commandMeta);
    return { body: commandPayload };
};

class PaymentEventValidation extends InputValidation {
    constructor(payload, meta) {
        super({
            type: 'PAYMENT.EVENT.QUEUED',
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
        })
    }
};