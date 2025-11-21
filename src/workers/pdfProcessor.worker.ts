// src/workers/pdfProcessor.worker.ts
import { parentPort, isMainThread } from 'worker_threads';
import fs from 'fs';
// A importação correta para um módulo CommonJS que usa 'module.exports'
// de dentro de um módulo ES. Importamos todo o namespace.
import * as pdfParse from 'pdf-parse';

if (isMainThread) {
  throw new Error('Este arquivo deve ser executado como um Worker Thread.');
}

if (!parentPort) {
  throw new Error('Este arquivo deve ser executado como um Worker Thread.');
}

parentPort.on('message', async (filePath: string) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);

    // O Node.js, ao importar um CJS via namespace, geralmente coloca o 'module.exports'
    // na propriedade 'default' do objeto importado.
    // Usamos 'as any' para dizer ao TypeScript: "Eu sei o que estou fazendo, confie em mim".
    const pdf = (pdfParse as any).default;
    const data = await pdf(dataBuffer);

    parentPort?.postMessage({
      success: true,
      pageCount: data.numpages,
    });
  } catch (error) {
    parentPort?.postMessage({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao processar PDF.',
    });
  } finally {
    // try {
    //   fs.unlinkSync(filePath);
    // } catch (cleanupError) {
    //   console.error(`Falha ao limpar o arquivo temporário: ${filePath}`, cleanupError);
    // }
  }
});