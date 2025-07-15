const AWS = require('aws-sdk');

// Configurar AWS SDK
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });

const sqs = new AWS.SQS();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const MESSAGE_QUEUE_URL = process.env.MESSAGE_QUEUE_URL;
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;

module.exports = {
    async processAsync(eventPayload, eventMeta) {
        const startTime = Date.now();
        
        console.log('💾 Saving original event to DynamoDB...');
        await this.saveToDynamoDB({
            ...eventPayload,
            event_type: 'original',
            received_at: new Date().toISOString(),
            lambda_name: eventMeta.source,
            message_id: eventMeta.messageId
        });

        console.log('📤 Sending to SQS for async processing...');
        const sqsSendParams = {
            MessageBody: JSON.stringify({
                Payload: eventPayload,
                Meta: eventMeta
            }),
            QueueUrl: MESSAGE_QUEUE_URL
        };
        
        const sqsResult = await sqs.sendMessage(sqsSendParams).promise();
        console.log('✅ Message sent to SQS:', sqsResult.MessageId);

        return {
            processingTime: Date.now() - startTime,
            flow: 'async',
            sqsMessageId: sqsResult.MessageId
        };
    },

    async processSync(eventPayload, eventMeta) {
        const startTime = Date.now();
        
        console.log('💾 Saving original event to DynamoDB...');
        await this.saveToDynamoDB({
            ...eventPayload,
            event_type: 'original',
            received_at: new Date().toISOString(),
            lambda_name: eventMeta.source,
            message_id: eventMeta.messageId
        });

        console.log('⚡ Processing event directly...');
        const processedEvent = await this.processEvent(eventPayload);
        
        console.log('💾 Saving processed event to DynamoDB...');
        await this.saveToDynamoDB({
            ...processedEvent,
            event_type: 'processed',
            processed_at: new Date().toISOString(),
            lambda_name: eventMeta.source,
            message_id: eventMeta.messageId
        });

        return {
            processingTime: Date.now() - startTime,
            flow: 'sync'
        };
    },

    async processWithExternalCall(eventPayload, eventMeta) {
        const startTime = Date.now();
        
        console.log('💾 Saving original event to DynamoDB...');
        await this.saveToDynamoDB({
            ...eventPayload,
            event_type: 'original',
            received_at: new Date().toISOString(),
            lambda_name: eventMeta.source,
            message_id: eventMeta.messageId
        });

        console.log('🌐 Simulating external API call (2 seconds)...');
        await this.simulateExternalCall();
        
        console.log('⚡ Processing event after external call...');
        const processedEvent = await this.processEvent(eventPayload);
        
        console.log('💾 Saving processed event to DynamoDB...');
        await this.saveToDynamoDB({
            ...processedEvent,
            event_type: 'processed',
            processed_at: new Date().toISOString(),
            lambda_name: eventMeta.source,
            message_id: eventMeta.messageId
        });

        return {
            processingTime: Date.now() - startTime,
            flow: 'sync_with_external'
        };
    },

    async processEvent(eventPayload) {
        console.log('🔄 Applying business logic to event...');
        
        // Lógica de procesamiento del evento
        const processedEvent = {
            ...eventPayload,
            processed_amount: eventPayload.amount,
            processed_currency: eventPayload.currency,
            processing_status: 'completed',
            business_rules_applied: true,
            processing_timestamp: new Date().toISOString()
        };

        console.log('✅ Event processed successfully');
        return processedEvent;
    },

    async saveToDynamoDB(item) {
        const dynamoParams = {
            TableName: DYNAMODB_TABLE,
            Item: {
                ...item,
                id: `${item.event_id}_${item.event_type || 'original'}`,
                timestamp: new Date().toISOString(),
                ttl: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 año TTL
            }
        };
        
        try {
            await dynamodb.put(dynamoParams).promise();
            console.log('✅ Item saved to DynamoDB:', dynamoParams.Item.id);
        } catch (error) {
            console.error('❌ Error saving to DynamoDB:', error);
            throw error;
        }
    },

    async simulateExternalCall() {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('✅ External API call simulation completed');
                resolve();
            }, 2000);
        });
    }
}; 