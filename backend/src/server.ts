import express from 'express';
import * as http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { AuthController } from './controllers/auth.controller';
import { assetController } from './controllers/asset.controller';
import { contactController } from './controllers/contact.controller';
import { policyController } from './controllers/policy.controller';
import { emergencyController } from './controllers/emergency.controller';
import { adminController } from './controllers/admin.controller';
import { validateRequest } from './middlewares/validation.middleware';
import { requireAuth } from './middlewares/auth.middleware';
import { registerSchema, loginSchema, verifyMfaSchema } from './validators/auth.validator';
import { createAssetSchema } from './validators/asset.validator';
import { createPolicySchema } from './validators/policy.validator';
import { createEmergencyRequestSchema } from './validators/emergency.validator';
import { errorHandler } from './middlewares/error.middleware';
import { telemetry } from './utils/telemetry';
import { startDeprovisionJob } from './jobs/deprovision.job';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize Standard Middlewares
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Initialize Auth Controller Routes
const authController = new AuthController();

app.post('/api/v1/auth/register', validateRequest(registerSchema), authController.register);
app.post('/api/v1/auth/login', validateRequest(loginSchema), authController.login);
app.post('/api/v1/auth/mfa/verify', validateRequest(verifyMfaSchema), authController.verifyMfa);
app.post('/api/v1/auth/logout', authController.logout);

// Initialize Asset Core Routes
app.post('/api/v1/assets', requireAuth, validateRequest(createAssetSchema), assetController.create);
app.get('/api/v1/assets', requireAuth, assetController.list);
app.get('/api/v1/assets/:id', requireAuth, assetController.get);
app.delete('/api/v1/assets/:id', requireAuth, assetController.delete);

// Initialize Emergency Contact Routes
app.post('/api/v1/contacts', requireAuth, contactController.create);
app.get('/api/v1/contacts', requireAuth, contactController.list);
app.put('/api/v1/contacts/:id/verify', requireAuth, contactController.verify);
app.delete('/api/v1/contacts/:id', requireAuth, contactController.delete);

// Initialize Conditional Policy Routes
app.post('/api/v1/policies', requireAuth, validateRequest(createPolicySchema), policyController.create);
app.get('/api/v1/policies', requireAuth, policyController.list);
app.delete('/api/v1/policies/:id', requireAuth, policyController.delete);

// Initialize Break-Glass Emergency Routes
app.post('/api/v1/emergency/request', requireAuth, validateRequest(createEmergencyRequestSchema), emergencyController.create);
app.post('/api/v1/emergency/:id/evidence', requireAuth, emergencyController.uploadEvidence);
app.post('/api/v1/emergency/:id/approve', requireAuth, emergencyController.approve);
app.post('/api/v1/emergency/:id/reject', requireAuth, emergencyController.reject);
app.get('/api/v1/emergency/requests', requireAuth, emergencyController.list);
app.get('/api/v1/emergency/:id', requireAuth, emergencyController.get);
app.get('/api/v1/emergency/vault/:token', emergencyController.getVaultByToken); // Token-scoped public access route

// Initialize Admin Monitoring Routes
app.get('/api/v1/admin/metrics', requireAuth, adminController.getMetrics);
app.get('/api/v1/admin/logs', requireAuth, adminController.getLogs);

// Public check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'HEALTHY', timestamp: new Date().toISOString() });
});

// Centralized error handler placement
app.use(errorHandler);

// Bootstrap HTTP Server
const server = http.createServer(app);

// Bootstrap WebSocket Server for Real-Time Telemetry Pipeline (Developer Console)
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws: WebSocket) => {
  console.log('[Telemetry WS] Client console connected successfully');
  telemetry.registerWsClient(ws);

  ws.on('close', () => {
    console.log('[Telemetry WS] Client console disconnected');
    telemetry.removeWsClient(ws);
  });
});

// Handle upgrade requests specifically for telemetry WebSocket route
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
  
  if (pathname === '/api/v1/developer/stream') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Start Server Listeners
server.listen(port, () => {
  console.log(`[Heirloom Server] running on http://localhost:${port}`);
  console.log(`[Telemetry stream] listening on ws://localhost:${port}/api/v1/developer/stream`);
  
  // Start automatic deprovisioning background sweeping jobs
  startDeprovisionJob();
});
