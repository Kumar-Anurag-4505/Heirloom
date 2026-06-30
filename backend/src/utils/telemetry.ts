import { EventEmitter } from 'events';

export interface TelemetryEvent {
  timestamp: string;
  pingProduct: 'PingAM' | 'PingDS' | 'PingID' | 'PingIDM' | 'PingOne Protect';
  action: string;
  details: Record<string, any>;
}

class TelemetryService extends EventEmitter {
  private static instance: TelemetryService;
  private wsClients: Set<any> = new Set();

  private constructor() {
    super();
  }

  public static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  public registerWsClient(ws: any) {
    this.wsClients.add(ws);
    // Send initial configuration status
    ws.send(JSON.stringify({
      type: 'HEALTH',
      message: 'Telemetry pipeline active',
      timestamp: new Date().toISOString()
    }));
  }

  public removeWsClient(ws: any) {
    this.wsClients.delete(ws);
  }

  public publish(event: Omit<TelemetryEvent, 'timestamp'>) {
    const fullEvent: TelemetryEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };
    
    // Emit internal event
    this.emit('telemetry', fullEvent);

    // Broadcast to WebSocket clients
    const payload = JSON.stringify({
      type: 'TELEMETRY',
      data: fullEvent
    });

    for (const client of this.wsClients) {
      if (client.readyState === 1) { // OPEN
        client.send(payload);
      }
    }
  }
}

export const telemetry = TelemetryService.getInstance();
