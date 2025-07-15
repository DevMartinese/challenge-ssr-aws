const domain = require('../domain');

module.exports.handler = async (event, context) => {
    console.log('📥 SQS Event received:', JSON.stringify(event, null, 2));
    
    const startTime = Date.now();
    const results = [];
    
    try {
        // Procesar cada record del evento SQS
        for (const record of event.Records) {
            if (record.eventSource === 'aws:sqs') {
                const messageBody = JSON.parse(record.body);
                const eventMeta = {
                    source: context.functionName,
                    timestamp: record.attributes.SentTimestamp,
                    messageId: record.messageId,
                    receiptHandle: record.receiptHandle
                };
                
                console.log('📨 Processing SQS message:', JSON.stringify(messageBody, null, 2));
                
                const result = await domain(messageBody.Payload, eventMeta);
                results.push(result);
                
                console.log('✅ Message processed successfully:', JSON.stringify(result, null, 2));
            }
        }
        
        const processingTime = Date.now() - startTime;
        console.log(`⏱️ Total processing time: ${processingTime}ms`);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'SQS messages processed successfully',
                processedCount: results.length,
                processingTime,
                results
            })
        };
        
    } catch (error) {
        console.error('❌ Error processing SQS events:', error);
        throw error;
    }
};