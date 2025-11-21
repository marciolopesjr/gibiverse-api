// src/routes/upload.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { BusinessError } from '../services/user.service.js';
import logger from '../utils/logger.js';

// Configuração para obter __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadRouter = Router();

const UPLOAD_DIR = './uploads';
// Garante que o diretório existe na inicialização
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// --- Configuração para Imagens de Capa ---
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname);
    cb(null, `image-${uniqueSuffix}${extension}`);
  },
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new BusinessError('Formato de arquivo inválido. Apenas imagens são permitidas.', 400));
    }
  },
});

// --- Configuração para Documentos PDF ---
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${extension}`);
  },
});

const pdfUpload = multer({
  storage: pdfStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new BusinessError('Formato de arquivo inválido. Apenas PDFs são permitidos.', 400));
    }
  },
});

// --- Rota para Imagem de Capa ---
uploadRouter.post(
  '/image',
  authMiddleware,
  imageUpload.single('image'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo foi enviado.' });
    }
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(201).json({ message: 'Arquivo enviado com sucesso.', url: fileUrl });
  },
);

// --- ROTA PARA DOCUMENTO PDF DA HQ ---
uploadRouter.post(
  '/hq-document',
  authMiddleware,
  pdfUpload.single('document'),
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next(new BusinessError('Nenhum documento PDF foi enviado.', 400));
    }

    // Lógica de Caminho Robusta:
    // Estamos em: src/routes/ (dev) ou dist/routes/ (prod)
    // O worker está em: src/workers/ ou dist/workers/
    // path.join resolve os '..' corretamente independente do SO.
    // IMPORTANTE: O arquivo alvo deve ser .js se estivermos rodando via node normal,
    // ou .ts se estivermos via tsx, mas workers com tsx são complexos.
    // Assumiremos aqui que o build gera o .js em dist/workers/pdfProcessor.worker.js
    
    // Tentativa de detectar ambiente (Dev vs Prod) simples
    const isTsExecution = path.extname(__filename) === '.ts';
    const extension = isTsExecution ? '.ts' : '.js';
    
    const workerPath = path.join(__dirname, '..', 'workers', `pdfProcessor.worker${extension}`);

    // Verificação de sanidade
    if (!fs.existsSync(workerPath) && !isTsExecution) {
        // Se não achou o arquivo .js, talvez estejamos rodando localmente sem build
        // Tentamos apontar para o src caso seja um ambiente misto (raro mas possível)
        logger.warn(`Worker não encontrado em ${workerPath}. Verifique o build.`);
    }

    const worker = new Worker(workerPath);

    const workerResponse = new Promise<{ success: boolean; pageCount?: number; error?: string }>((resolve, reject) => {
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker parou com o exit code ${code}`));
        }
      });
    });

    worker.postMessage(req.file.path);

    try {
      const result = await workerResponse;

      if (result.success) {
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        res.status(201).json({
          message: 'Documento processado com sucesso.',
          url: fileUrl,
          pageCount: result.pageCount,
        });
      } else {
        // Limpa arquivo se falhou o processamento
        fs.unlink(req.file.path, (err) => {
          if (err) logger.error(err, `Falha ao limpar o arquivo após erro do worker: ${req.file?.path}`);
        });
        throw new BusinessError(result.error || 'Falha ao processar PDF.', 500);
      }
    } catch (error) {
      next(error);
    }
  },
);

export default uploadRouter;