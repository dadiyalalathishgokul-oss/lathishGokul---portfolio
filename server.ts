import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const PYTHON_PORT = Number(process.env.PYTHON_PORT || 8765);
const PYTHON_ORIGIN = `http://127.0.0.1:${PYTHON_PORT}`;

let pythonProc: ChildProcess | null = null;
let shuttingDown = false;

function startPythonBackend(): void {
  if (pythonProc || shuttingDown) return;

  pythonProc = spawn('python3', ['-m', 'python_app.server'], {
    cwd: __dirname,
    env: {
      ...process.env,
      PYTHON_HOST: '127.0.0.1',
      PYTHON_PORT: String(PYTHON_PORT),
      PYTHONUNBUFFERED: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  pythonProc.stdout?.on('data', (chunk: Buffer) => {
    process.stdout.write(`[python] ${chunk.toString()}`);
  });

  pythonProc.stderr?.on('data', (chunk: Buffer) => {
    process.stderr.write(`[python] ${chunk.toString()}`);
  });

  pythonProc.on('exit', (code) => {
    pythonProc = null;
    if (!shuttingDown) {
      console.error(`[python] exited unexpectedly with code ${code}; restarting...`);
      setTimeout(startPythonBackend, 750);
    }
  });
}

async function waitForPythonReady(timeoutMs = 8000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${PYTHON_ORIGIN}/api/py/health`);
      if (res.ok) return;
    } catch {
      // Python server still warming up
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  console.warn('[python] health check timed out; continuing and retrying on request');
}

async function proxyToPython(req: Request, res: Response): Promise<void> {
  const targetUrl = `${PYTHON_ORIGIN}${req.originalUrl}`;
  const method = req.method.toUpperCase();

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    let body: string | undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(req.body ?? {});
    }

    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body,
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
    const contentDisposition = upstream.headers.get('content-disposition');
    if (contentDisposition) {
      res.setHeader('Content-Disposition', contentDisposition);
    }
    res.status(upstream.status).setHeader('Content-Type', contentType).send(text);
  } catch (err) {
    console.error('[proxy] Python backend error:', err);
    res.status(502).json({
      error: 'Python portfolio backend is temporarily unavailable.',
    });
  }
}

async function bootstrap(): Promise<void> {
  startPythonBackend();
  await waitForPythonReady();

  const app = express();
  app.use(express.json({ limit: '256kb' }));

  app.all('/api/py/*', (req, res) => {
    void proxyToPython(req, res);
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Production build not found.');
      }
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Portfolio app running on http://0.0.0.0:${PORT} (Python API on ${PYTHON_ORIGIN})`);
  });

  const cleanup = (): void => {
    shuttingDown = true;
    server.close();
    if (pythonProc) {
      pythonProc.kill('SIGTERM');
    }
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

void bootstrap();
