const fs = require('fs');
const path = require('path');

// Simular evento SNS
const snsEvent = {
    Records: [
        {
            EventSource: 'aws:sns',
            Sns: {
                Message: JSON.stringify({
                    event_id: 'evt_123456789',
                    channel: 'qr-pct',
                    amount: 1500,
                    currency: 'ARS',
                    customer_id: 'cust_987654321',
                    timestamp: '2024-01-15T10:30:00.000Z'
                }),
                MessageId: 'msg_123456789',
                Timestamp: new Date().toISOString()
            }
        }
    ]
};

// Simular evento SQS
const sqsEvent = {
    Records: [
        {
            eventSource: 'aws:sqs',
            body: JSON.stringify({
                Payload: {
                    event_id: 'evt_123456789',
                    channel: 'qr-pct',
                    amount: 1500,
                    currency: 'ARS',
                    customer_id: 'cust_987654321',
                    timestamp: '2024-01-15T10:30:00.000Z'
                }
            }),
            messageId: 'msg_987654321',
            receiptHandle: 'receipt_handle_123',
            attributes: {
                SentTimestamp: new Date().toISOString()
            }
        }
    ]
};

// Mock del contexto Lambda
const mockContext = {
    functionName: 'payment-events-processor-dev-receiveMessage',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:payment-events-processor-dev-receiveMessage',
    memoryLimitInMB: '256',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/payment-events-processor-dev-receiveMessage',
    logStreamName: '2024/01/15/[$LATEST]test-stream',
    getRemainingTimeInMillis: () => 30000
};

// Función para invocar receiveMessage
async function invokeReceiveMessage() {
    try {
        console.log('🧪 Testing receiveMessage (SNS) with AWS SDK...');
        const receiveMessageHandler = require('../src/receiveMessage/handler/index.js');
        const result = await receiveMessageHandler.handler(snsEvent, mockContext);
        console.log('✅ receiveMessage result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('❌ receiveMessage error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Función para invocar publishMessage
async function invokePublishMessage() {
    try {
        console.log('🧪 Testing publishMessage (SQS) with AWS SDK...');
        const publishMessageHandler = require('../src/publishMessage/handler/index.js');
        const result = await publishMessageHandler.handler(sqsEvent, mockContext);
        console.log('✅ publishMessage result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('❌ publishMessage error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Función para probar diferentes canales
async function testDifferentChannels() {
    console.log('\n🧪 Testing different payment channels...');
    
    const channels = [
        { channel: 'qr-pct', amount: 1500, currency: 'ARS', description: 'Async flow (qr-pct > 1000 ARS)' },
        { channel: 'qr-pct', amount: 500, currency: 'ARS', description: 'Sync flow (qr-pct <= 1000 ARS)' },
        { channel: 'qr-tctd', amount: 2000, currency: 'USD', description: 'Direct processing (qr-tctd)' },
        { channel: 'link', amount: 3000, currency: 'ARS', description: 'External call simulation (link)' }
    ];
    
    for (const testCase of channels) {
        console.log(`\n📋 Testing: ${testCase.description}`);
        
        const testEvent = {
            Records: [
                {
                    EventSource: 'aws:sns',
                    Sns: {
                        Message: JSON.stringify({
                            event_id: `evt_${Date.now()}`,
                            channel: testCase.channel,
                            amount: testCase.amount,
                            currency: testCase.currency,
                            customer_id: 'cust_test',
                            timestamp: new Date().toISOString()
                        }),
                        MessageId: `msg_${Date.now()}`,
                        Timestamp: new Date().toISOString()
                    }
                }
            ]
        };
        
        try {
            const receiveMessageHandler = require('../src/receiveMessage/handler/index.js');
            const result = await receiveMessageHandler.handler(testEvent, mockContext);
            console.log(`✅ ${testCase.description} - Success`);
        } catch (error) {
            console.error(`❌ ${testCase.description} - Error:`, error.message);
        }
    }
}

// Ejecutar pruebas
async function runTests() {
    console.log('🚀 Starting AWS SDK implementation tests...\n');
    
    await invokeReceiveMessage();
    await invokePublishMessage();
    await testDifferentChannels();
    
    console.log('\n🎉 All tests completed!');
}

runTests(); 