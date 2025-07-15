const domain = require('../domain');

module.exports.handler = async (event, context) => {
    console.log('📥 SNS Event received:', JSON.stringify(event, null, 2));
    
    const startTime = Date.now();
    const results = [];
    
    try {
        // Procesar cada record del evento SNS
        for (const record of event.Records) {
            if (record.EventSource === 'aws:sns') {
                const snsMessage = JSON.parse(record.Sns.Message);
                const eventMeta = {
                    source: context.functionName,
                    timestamp: record.Sns.Timestamp,
                    messageId: record.Sns.MessageId
                };
                
                console.log('📨 Processing SNS message:', JSON.stringify(snsMessage, null, 2));
                
                const result = await domain(snsMessage, eventMeta);
                results.push(result);
                
                console.log('✅ Message processed successfully:', JSON.stringify(result, null, 2));
            }
        }
        
        const processingTime = Date.now() - startTime;
        console.log(`⏱️ Total processing time: ${processingTime}ms`);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Events processed successfully',
                processedCount: results.length,
                processingTime,
                results
            })
        };
        
    } catch (error) {
        console.error('❌ Error processing SNS events:', error);
        throw error;
    }
};