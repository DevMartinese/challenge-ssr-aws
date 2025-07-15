# 🧠 Desafío Técnico – Node.js + AWS

## Objetivo

Construir una solución serverless robusta para procesar eventos de pago provenientes de múltiples canales, con trazabilidad y flujos sincrónicos/asincrónicos.

---

## 🧾 Escenario

Tu equipo está desarrollando un módulo para manejar eventos de pagos provenientes de múltiples canales (QR, Link de Pago). Cada evento debe ser validado, procesado según ciertas reglas de negocio y almacenado en una base de datos para trazabilidad y consultas posteriores.

---

## 📌 Requisitos Funcionales

### Evento de Entrada

Una Lambda suscripta a un SNS Topic recibe eventos con la siguiente estructura:

```json
{
  "event_id": "string",
  "channel": "qr-pct" | "qr-tctd" | "link",
  "amount": number,
  "currency": "ARS" | "USD",
  "customer_id": "string",
  "timestamp": "ISO string"
}
```

### Lógica de Procesamiento

- Si el canal es `qr-pct` y el monto es mayor a **1000 ARS**, se debe continuar el flujo de manera **asincrónica**, enviando el evento a una cola SQS.
- Si el canal es `qr-tctd`, el evento debe procesarse **directamente** dentro de la Lambda suscripta al SNS.
- Si el canal es `link`, simular una llamada a un proveedor externo (por ejemplo, con `setTimeout` de 2 segundos) antes de guardar el resultado.

---

## 🛠️ Requisitos Técnicos

- Lenguaje: **Node.js + TypeScript**
- Infraestructura: **AWS Lambda**, **SNS**, **SQS**, **DynamoDB**
- Framework: **Serverless Framework**
- Guardar eventos originales y procesados en **DynamoDB**
- Incluir logs estructurados con información clave:
  - Tiempo de procesamiento total
  - Nombre de la Lambda que lo procesó
  - Tipo de flujo (sync o async)

---

## 🚀 Implementación

### Arquitectura

La solución implementa una arquitectura limpia usando la librería **ebased**:

```
SNS Topic → receiveMessage (Lambda) → SQS Queue → publishMessage (Lambda)
                ↓                           ↓
            DynamoDB                   DynamoDB
```

### Estructura del Proyecto

```
src/
├── receiveMessage/          # Lambda suscripta a SNS
│   ├── handler/            # Manejo de eventos SNS
│   ├── domain/             # Lógica de negocio
│   └── service/            # Servicios de infraestructura
└── publishMessage/         # Lambda suscripta a SQS
    ├── handler/            # Manejo de eventos SQS
    ├── domain/             # Lógica de negocio
    └── service/            # Servicios de infraestructura
```

### Flujos de Procesamiento

1. **qr-pct + amount > 1000 ARS**: Flujo asíncrono
   - Evento recibido → Guardado en DynamoDB → Enviado a SQS → Procesado por publishMessage

2. **qr-tctd**: Flujo síncrono
   - Evento recibido → Procesado directamente → Guardado en DynamoDB

3. **link**: Flujo síncrono con llamada externa
   - Evento recibido → Simulación de llamada externa (2s) → Procesado → Guardado en DynamoDB

---

## 🛠️ Instalación y Uso

### Prerrequisitos

- Node.js 22.x
- AWS CLI configurado
- Serverless Framework instalado globalmente

### Instalación

```bash
npm install
```

### Deployment

```bash
# Deploy en desarrollo
npm run deploy

# Deploy en producción
npm run deploy:prod
```

### Testing Local

```bash
# Ejecutar pruebas locales
npm run test:local
```

### Monitoreo

```bash
# Ver logs de receiveMessage
npm run logs

# Ver logs de publishMessage
npm run logs:publish
```

### Limpieza

```bash
# Remover recursos de AWS
npm run remove
```

---

## 📊 Recursos AWS Creados

- **SNS Topic**: `payment-events-topic-develop`
- **SQS Queue**: `payment-events-queue-develop`
- **SQS DLQ**: `payment-events-dlq-develop`
- **DynamoDB Table**: `payment-events-develop`
- **Lambda Functions**: `receiveMessage`, `publishMessage`

---

## 🧪 Extras valorados (no obligatorios, pero suman puntos)

- ✅ Tests unitarios y/o de integración
- ✅ Validación de esquema de entrada (ebased InputValidation)
- ✅ Retry policies y DLQ para SQS
- ✅ Separación clara de capas (handlers / domain / infra)
- ✅ Uso de variables de entorno por stage/config

---

## 📦 Entrega

- ✅ Solución subida a repositorio público
- ✅ README.md con instrucciones claras de ejecución
- ✅ Explicación de decisiones técnicas
- ✅ Arquitectura limpia con ebased
- ✅ Implementación completa de todos los requisitos

🚀 **QrCode Team – NX**
