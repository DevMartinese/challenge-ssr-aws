const AWS = require('aws-sdk');

// Configurar AWS SDK
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });

const dynamodb = new AWS.DynamoDB.DocumentClient();

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;

module.exports = async (payload, eventMeta) => {
    console.log('💾 Saving queued event to DynamoDB...');
    
    try {
        const dynamoParams = {
            TableName: DYNAMODB_TABLE,
            Item: {
                ...payload,
                event_type: 'queued_processed',
                queued_at: new Date().toISOString(),
                lambda_name: eventMeta.source,
                message_id: eventMeta.messageId,
                id: `${payload.event_id}_queued_processed`,
                timestamp: new Date().toISOString(),
                ttl: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 año TTL
            }
        };
        
        await dynamodb.put(dynamoParams).promise();
        console.log('✅ Queued event saved to DynamoDB:', dynamoParams.Item.id);
        
        return {
            status: 'success',
            message: 'Event processed from queue successfully'
        };
        
    } catch (error) {
        console.error('❌ Error saving queued event to DynamoDB:', error);
        throw error;
    }
};