const sns = require('ebased/service/downstream/sns');
const dynamo = require('ebased/service/storage/dynamo');
const config = require('ebased/util/config');

const MESSAGE_TOPIC_URL = config.get('MESSAGE_TOPIC_URL');
const DYNAMODB_TABLE = config.get('DYNAMODB_TABLE');

module.exports = {
    async processAsync(eventPayload, eventMeta) {
        const startTime = Date.now();
        
        // Guardar evento original en DynamoDB
        await this.saveToDynamoDB({
            ...eventPayload,
            event_type: 'original',
            received_at: new Date().toISOString(),
            lambda_name: eventMeta.source
        });

        // Enviar a SNS para procesamiento asíncrono
        await sns.publish({
            TopicArn: MESSAGE_TOPIC_URL,
            Message: JSON.stringify({
                Payload: eventPayload,
                Meta: eventMeta
            })
        });

        return {
            processingTime: Date.now() - startTime,
            flow: 'async'
        };
    },

    async processSync(eventPayload, eventMeta) {
        const startTime = Date.now();
        
        // Guardar evento original
        await this.saveToDynamoDB({
            ...eventPayload,
            event_type: 'original',
            received_at: new Date().toISOString(),
            lambda_name: eventMeta.source
        });

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
            processingTime: Date.now() - startTime,
            flow: 'sync'
        };
    },

    async processWithExternalCall(eventPayload, eventMeta) {
        const startTime = Date.now();
        
        // Guardar evento original
        await this.saveToDynamoDB({
            ...eventPayload,
            event_type: 'original',
            received_at: new Date().toISOString(),
            lambda_name: eventMeta.source
        });

        // Simular llamada externa (2 segundos)
        await this.simulateExternalCall();
        
        // Procesar evento
        const processedEvent = await this.processEvent(eventPayload);
        
        // Guardar evento procesado
        await this.saveToDynamoDB({
            ...processedEvent,
            event_type: 'processed',
            processed_at: new Date().toISOString(),
            lambda_name: eventMeta.source
        });

        return {
            processingTime: Date.now() - startTime,
            flow: 'sync_with_external'
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
    },

    async simulateExternalCall() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 2000);
        });
    }
}; 