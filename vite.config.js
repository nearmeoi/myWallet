import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [
      react(),
      {
        name: 'api-dev-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && req.url.startsWith('/api/')) {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  req.body = body ? JSON.parse(body) : {};
                  if (req.url.startsWith('/api/send-debt-reminder')) {
                    const { default: handler } = await import('./api/send-debt-reminder.js');
                    await handler(req, res);
                  } else if (req.url.startsWith('/api/parse-receipt')) {
                    const { default: handler } = await import('./api/parse-receipt.js');
                    await handler(req, res);
                  } else if (req.url.startsWith('/api/quick-transaction')) {
                    const { default: handler } = await import('./api/quick-transaction.js');
                    await handler(req, res);
                  } else {
                    res.statusCode = 404;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Not Found' }));
                  }
                } catch (e) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: e.message }));
                }
              });
              return;
            }
            next();
          });
        }
      }
    ],
    base: './', // Use relative paths for assets
    preview: {
      allowedHosts: ['wallet.neardev.my.id', 'app.monev-absenbot.my.id']
    },
    server: {
      host: true
    }
  };
});