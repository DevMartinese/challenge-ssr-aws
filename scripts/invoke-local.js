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
                })
            }
        }
    ]
};

// Simular evento SQS
const sqsEvent = {
    Records: [
        {
            body: JSON.stringify({
                Payload: {
                    event_id: 'evt_123456789',
                    channel: 'qr-pct',
                    amount: 1500,
                    currency: 'ARS',
                    customer_id: 'cust_987654321',
                    timestamp: '2024-01-15T10:30:00.000Z'
                }
            })
        }
    ]
};

// Función para invocar receiveMessage
async function invokeReceiveMessage() {
    try {
        const receiveMessageHandler = require('../src/receiveMessage/handler/index.js');
        const result = await receiveMessageHandler.handler(snsEvent, {});
        console.log('✅ receiveMessage result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('❌ receiveMessage error:', error);
    }
}

// Función para invocar publishMessage
async function invokePublishMessage() {
    try {
        const publishMessageHandler = require('../src/publishMessage/handler/index.js');
        const result = await publishMessageHandler.handler(sqsEvent, {});
        console.log('✅ publishMessage result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('❌ publishMessage error:', error);
    }
}

// Ejecutar pruebas
async function runTests() {
    console.log('🧪 Testing receiveMessage (SNS)...');
    await invokeReceiveMessage();
    
    console.log('\n🧪 Testing publishMessage (SQS)...');
    await invokePublishMessage();
}

runTests(); 