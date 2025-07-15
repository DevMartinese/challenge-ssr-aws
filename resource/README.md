# 📁 Resource Files

Esta carpeta contiene los archivos de recursos AWS separados del `serverless.yml` principal para mejor organización y mantenimiento.

## 📋 Estructura

```
resource/
├── README.md          # Este archivo
├── sns.yml           # Recursos SNS (Topics)
├── sqs.yml           # Recursos SQS (Queues)
└── dynamodb.yml      # Recursos DynamoDB (Tables)
```

## 🔧 Archivos

### `sns.yml`
- **PaymentEventsTopic**: Topic SNS para eventos de pago
- Incluye suscripción email para notificaciones
- Naming convention: `${service}-${stage}-PaymentEventsTopic`

### `sqs.yml`
- **PaymentEventsQueue**: Cola principal para procesamiento asíncrono
- **PaymentEventsDLQ**: Dead Letter Queue para mensajes fallidos
- Configuración de retry y retención de mensajes
- Naming convention: `${service}-${stage}-PaymentEventsQueue`

### `dynamodb.yml`
- **PaymentEventsTable**: Tabla para almacenar eventos de pago
- Índice global secundario por timestamp
- Modo de facturación bajo demanda
- Naming convention: `${service}-${stage}-PaymentEvents`

## 🚀 Uso

Los archivos se referencian en el `serverless.yml` principal usando:

```yaml
resources:
  - ${file(resource/sns.yml)}
  - ${file(resource/sqs.yml)}
  - ${file(resource/dynamodb.yml)}
```

## ✅ Ventajas

- **Organización**: Cada tipo de recurso en su propio archivo
- **Mantenimiento**: Más fácil de mantener y actualizar
- **Reutilización**: Archivos pueden ser reutilizados en otros proyectos
- **Claridad**: Estructura más clara y legible
- **Versionado**: Mejor control de cambios por tipo de recurso 