// src/utils/logger.ts
import pino from 'pino';

// Esta parte do código é a chave.
// O "transport" diz ao Pino para, em vez de logar para o stdout,
// iniciar o pino-pretty como um processo filho e enviar os logs para ele.
// Isso evita completamente o pipe do shell do Windows.
const transport = pino.transport({
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
    ignore: 'pid,hostname',
  },
});

const logger = pino(
  {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
  // Usa o transport bonito apenas se não estiver em produção
  process.env.NODE_ENV !== 'production' ? transport : undefined,
);

export default logger;