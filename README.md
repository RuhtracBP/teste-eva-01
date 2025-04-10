# Agendador de Atividades (Activity Scheduler)

## O que é

Um sistema de agendamento de atividades que utiliza BullMQ para processamento de jobs e Joi para validação de dados. O sistema permite agendar atividades para execução futura com gestão robusta de filas e processamento assíncrono.

## Por que resolve o problema

O sistema resolve desafios comuns em ambientes que necessitam de agendamento confiável de tarefas:

- Garante a execução precisa de atividades em horários específicos
- Oferece tolerância a falhas com tentativas automáticas de reexecução
- Mantém histórico completo de execuções para auditoria
- Permite monitoramento em tempo real do status das atividades

## Benefícios

- Interface amigável para agendamento e monitoramento
- Sistema distribuído e escalável usando Redis
- Processamento assíncrono robusto
- Validação rigorosa de dados de entrada
- Gestão eficiente de filas com BullMQ

## Pré-requisitos

- Docker
- Docker Compose

## Executando com Docker

1. Construa e inicie a aplicação:

```bash
docker-compose up --build
```

Isso iniciará:

- Aplicação web na porta 3000
- Processo worker
- Servidor Redis na porta 6379

Para parar a aplicação:

```bash
docker-compose down
```

3. Abra seu navegador e acesse: http://localhost:3000

## Executando Testes

```bash
npm test
```

## Endpoints da API

- POST `/api/activities/schedule` - Agendar novas atividades
- GET `/api/activities/jobs/:userName` - Obter todas as atividades de um usuário específico

## Interface Web

A interface fornece um ambiente simples para:

- Agendar novas atividades
- Visualizar atividades agendadas por usuário
