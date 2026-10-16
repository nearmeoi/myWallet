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
            if (req.url && req.url.startsWith('/api/send-debt-reminder')) {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const { default: handler } = await import('./api/send-debt-reminder.js');
                  req.body = body ? JSON.parse(body) : {};
                  await handler(req, res);
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