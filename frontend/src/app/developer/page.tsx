'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  Terminal, 
  Database, 
  Sliders, 
  Smartphone, 
  RefreshCw, 
  ArrowLeft,
  Settings,
  Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TelemetryLog {
  timestamp: string;
  pingProduct: string;
  action: string;
  details: Record<string, any>;
}

export default function DeveloperConsolePage() {
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [status, setStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('CONNECTING');
  const [selectedProduct, setSelectedProduct] = useState<string>('ALL');
  
  const wsRef = useRef<WebSocket | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  const connectWs = () => {
    setStatus('CONNECTING');
    const ws = new WebSocket('ws://localhost:3001/api/v1/developer/stream');
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('CONNECTED');
    };

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === 'TELEMETRY') {
        setLogs(prev => [payload.data, ...prev].slice(0, 100)); // Keep last 100 entries
      }
    };

    ws.onclose = () => {
      setStatus('DISCONNECTED');
    };
  };

  useEffect(() => {
    connectWs();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const filteredLogs = logs.filter(log => 
    selectedProduct === 'ALL' || log.pingProduct === selectedProduct
  );

  const getProductColor = (product: string) => {
    switch (product) {
      case 'PingAM': return 'text-blue-400 border-blue-500/20 bg-blue-950/20';
      case 'PingDS': return 'text-indigo-400 border-indigo-500/20 bg-indigo-950/20';
      case 'PingID': return 'text-yellow-400 border-yellow-500/20 bg-yellow-950/20';
      case 'PingIDM': return 'text-emerald-400 border-emerald-500/20 bg-emerald-950/20';
      case 'PingOne Protect': return 'text-red-400 border-red-500/20 bg-red-950/20';
      default: return 'text-neutral-400 border-white/5 bg-neutral-900/30';
    }
  };

  return (
    <div className="min-h-screen bg-black text-neutral-300 font-mono text-xs flex flex-col h-screen overflow-hidden selection:bg-blue-600/30">
      
      {/* Top Console Header */}
      <header className="h-14 border-b border-white/5 bg-neutral-950 px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-4">
          <Link href="/portal/dashboard" className="flex items-center gap-1 text-neutral-500 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            BACK
          </Link>
          <span className="text-neutral-700">|</span>
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-white tracking-tight uppercase">Ping Identity Developer Console</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* WS Status Indicator */}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              status === 'CONNECTED' ? 'bg-green-500 animate-pulse' : status === 'CONNECTING' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-[10px] text-neutral-500">{status}</span>
          </div>
          {status === 'DISCONNECTED' && (
            <button onClick={connectWs} className="p-1 rounded hover:bg-white/5 text-neutral-400 hover:text-white">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Sandbox Grid */}
      <div className="flex-grow flex overflow-hidden">
        
        {/* Left Side: Product Selector & State Inspection */}
        <aside className="w-80 border-r border-white/5 bg-neutral-950/40 p-6 space-y-6 flex-shrink-0 overflow-y-auto">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-neutral-600 tracking-wider uppercase block">Inspect Telemetry Feed</span>
            <div className="space-y-1">
              {['ALL', 'PingAM', 'PingDS', 'PingID', 'PingIDM', 'PingOne Protect'].map(product => (
                <button
                  key={product}
                  onClick={() => setSelectedProduct(product)}
                  className={`w-full text-left px-3 py-2 rounded border text-[11px] transition-all flex items-center justify-between ${
                    selectedProduct === product
                      ? 'border-blue-500/30 bg-blue-950/20 text-white font-bold'
                      : 'border-transparent text-neutral-400 hover:text-white hover:bg-white/2px'
                  }`}
                >
                  <span>{product === 'ALL' ? 'Show All Products' : product}</span>
                  {product !== 'ALL' && (
                    <span className="text-[9px] bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-500 font-normal">
                      {logs.filter(log => log.pingProduct === product).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 space-y-4">
            <span className="text-[10px] font-bold text-neutral-600 tracking-wider uppercase block">Active Directory Schema</span>
            <div className="p-3 bg-neutral-900/60 rounded border border-white/5 space-y-2 text-[10px] text-neutral-500">
              <p className="text-white font-semibold">dc=heirloom,dc=io</p>
              <p>  ├── ou=users</p>
              <p>  │   ├── uid=ping-usr-rahul (Owner)</p>
              <p>  │   └── uid=ping-usr-priya (Contact)</p>
              <p>  └── ou=policies</p>
              <p>      └── cn=spouse-breakglass-rules</p>
            </div>
          </div>
        </aside>

        {/* Right Side: Raw Streaming Event Terminal */}
        <main className="flex-grow flex flex-col bg-neutral-950 p-6 overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
            <span className="font-bold text-white tracking-wider">Live Event Stream</span>
            <button
              onClick={() => setLogs([])}
              className="flex items-center gap-1.5 text-neutral-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Console
            </button>
          </div>

          <div className="flex-grow overflow-y-auto space-y-4 pr-2 font-mono scrollbar-thin">
            {filteredLogs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-neutral-600">
                Waiting for backend events... (Register a user or create an asset to stream telemetry logs)
              </div>
            ) : (
              filteredLogs.map((log, index) => (
                <div key={index} className="p-4 rounded-lg bg-black/40 border border-white/5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase ${getProductColor(log.pingProduct)}`}>
                        {log.pingProduct}
                      </span>
                      <span className="text-white font-bold">{log.action}</span>
                    </div>
                    <span className="text-[10px] text-neutral-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>

                  <pre className="text-[11px] text-neutral-400 bg-neutral-950 p-3 rounded border border-white/2px overflow-x-auto max-h-40">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </main>
      </div>
    </div>
  );
}
