const fs = require('fs');
const path = require('path');

// Mock del contexto Lambda
const mockContext = {
    functionName: 'payment-events-processor-dev-ReceiveMessage',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:payment-events-processor-dev-ReceiveMessage',
    memoryLimitInMB: '256',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/payment-events-processor-dev-ReceiveMessage',
    logStreamName: '2024/01/15/[$LATEST]test-stream',
    getRemainingTimeInMillis: () => 30000
};

// Función para crear evento SNS
function createSnsEvent(paymentEvent) {
    return {
        Records: [
            {
                EventSource: 'aws:sns',
                Sns: {
                    Message: JSON.stringify(paymentEvent),
                    MessageId: `msg_${Date.now()}`,
                    Timestamp: new Date().toISOString()
                }
            }
        ]
    };
}

// Casos de prueba
const testCases = [
    {
        name: 'qr-pct > 1000 ARS (Async Flow)',
        event: {
            event_id: 'evt_async_001',
            channel: 'qr-pct',
            amount: 1500,
            currency: 'ARS',
            customer_id: 'cust_001',
            timestamp: '2024-01-15T10:30:00.000Z'
        }
    },
    {
        name: 'qr-pct <= 1000 ARS (Sync Flow)',
        event: {
            event_id: 'evt_sync_001',
            channel: 'qr-pct',
            amount: 500,
            currency: 'ARS',
            customer_id: 'cust_002',
            timestamp: '2024-01-15T10:31:00.000Z'
        }
    },
    {
        name: 'qr-tctd (Direct Processing)',
        event: {
            event_id: 'evt_tctd_001',
            channel: 'qr-tctd',
            amount: 2000,
            currency: 'USD',
            customer_id: 'cust_003',
            timestamp: '2024-01-15T10:32:00.000Z'
        }
    },
    {
        name: 'link (External Call Simulation)',
        event: {
            event_id: 'evt_link_001',
            channel: 'link',
            amount: 3000,
            currency: 'ARS',
            customer_id: 'cust_004',
            timestamp: '2024-01-15T10:33:00.000Z'
        }
    }
];

// Función para invocar receiveMessage
async function invokeReceiveMessage(snsEvent) {
    try {
        const receiveMessageHandler = require('../src/receiveMessage/handler/index.js');
        const result = await receiveMessageHandler.handler(snsEvent, mockContext);
        return { success: true, result };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Función para probar validaciones de ebased
async function testValidations() {
    console.log('\n🧪 Testing ebased InputValidation...');
    
    const invalidCases = [
        {
            name: 'Missing event_id',
            event: {
                channel: 'qr-pct',
                amount: 1500,
                currency: 'ARS',
                customer_id: 'cust_001',
                timestamp: '2024-01-15T10:30:00.000Z'
            }
        },
        {
            name: 'Invalid channel',
            event: {
                event_id: 'evt_invalid_001',
                channel: 'invalid-channel',
                amount: 1500,
                currency: 'ARS',
                customer_id: 'cust_001',
                timestamp: '2024-01-15T10:30:00.000Z'
            }
        },
        {
            name: 'Negative amount',
            event: {
                event_id: 'evt_invalid_002',
                channel: 'qr-pct',
                amount: -100,
                currency: 'ARS',
                customer_id: 'cust_001',
                timestamp: '2024-01-15T10:30:00.000Z'
            }
        },
        {
            name: 'Invalid currency',
            event: {
                event_id: 'evt_invalid_003',
                channel: 'qr-pct',
                amount: 1500,
                currency: 'EUR',
                customer_id: 'cust_001',
                timestamp: '2024-01-15T10:30:00.000Z'
            }
        }
    ];

    for (const testCase of invalidCases) {
        console.log(`\n📋 Testing: ${testCase.name}`);
        const snsEvent = createSnsEvent(testCase.event);
        const result = await invokeReceiveMessage(snsEvent);
        
        if (!result.success) {
            console.log(`✅ Validation failed as expected: ${result.error}`);
        } else {
            console.log(`❌ Validation should have failed but didn't`);
        }
    }
}

// Ejecutar pruebas
async function runTests() {
    console.log('🚀 Starting comprehensive tests with ebased InputValidation...\n');
    
    // Probar casos válidos
    for (const testCase of testCases) {
        console.log(`\n📋 Testing: ${testCase.name}`);
        const snsEvent = createSnsEvent(testCase.event);
        const result = await invokeReceiveMessage(snsEvent);
        
        if (result.success) {
            console.log(`✅ Success: ${testCase.name}`);
            console.log(`   Flow Type: ${result.result.body.flow_type}`);
            console.log(`   Processing Time: ${result.result.body.processing_time_ms}ms`);
        } else {
            console.error(`❌ Error: ${testCase.name} - ${result.error}`);
        }
    }
    
    // Probar validaciones
    await testValidations();
    
    console.log('\n🎉 All tests completed!');
}

runTests(); 