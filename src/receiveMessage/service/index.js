const sqs = require('ebased/service/downstream/sqs');
const dynamo = require('ebased/service/storage/dynamo');
const config = require('ebased/util/config');

const MESSAGE_QUEUE_URL = config.get('MESSAGE_QUEUE_URL');
const DYNAMODB_TABLE = config.get('DYNAMODB_TABLE');

module.exports = {
    async saveOriginalEvent(eventPayload, eventMeta) {
        // Guardar evento original en DynamoDB
        await this.saveToDynamoDB({
            ...eventPayload,
            event_type: 'original',
            received_at: new Date().toISOString(),
            lambda_name: eventMeta.source
        });
    },

    async processAsync(eventPayload, eventMeta) {
        // Enviar a SQS para procesamiento asíncrono
        const sqsSendParams = {
            MessageBody: {
                Payload: eventPayload,
                Meta: eventMeta
            },
            QueueUrl: MESSAGE_QUEUE_URL
        };
        await sqs.send(sqsSendParams);

        return {
            flow: 'async'
        };
    },

    async processSync(eventPayload, eventMeta) {
        // Procesar directamente
        const processedEvent = await this.processEvent(eventPayload);
        
        // Guardar evento procesado
        await this.saveToDynamoDB({
            ...processedEvent,
            event_type: 'processed',
            processed_at: new Date().toISOString(),
            lambda_name: eventMeta.source
        });

        return {
            flow: 'sync'
        };
    },

    async processEvent(eventPayload) {
        // Lógica de procesamiento del evento
        return {
            ...eventPayload,
            processed_amount: eventPayload.amount,
            processed_currency: eventPayload.currency,
            processing_status: 'completed',
            business_rules_applied: true
        };
    },

    async saveToDynamoDB(item) {
        const dynamoParams = {
            TableName: DYNAMODB_TABLE,
            Item: {
                ...item,
                id: `${item.event_id}_${item.event_type || 'original'}`,
                timestamp: new Date().toISOString()
            }
        };
        
        await dynamo.put(dynamoParams);
    }
}; 