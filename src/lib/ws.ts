/** Client WebSocket avec backoff exponentiel et resynchronisation REST (section 16.1). */
import { useAuthStore } from "../features/auth/authStore";

type Handler = (data: Record<string, unknown>) => void;

interface WSManagerOptions {
  onStatusChange?: (connected: boolean) => void;
  onReconnect?: () => void;
  handlers: Record<string, Handler>;
}

const MAX_BACKOFF_MS = 30000;

export class WSClient {
  private ws: WebSocket | null = null;
  private handlers: Record<string, Handler> = {};
  private backoff = 1000;
  private closed = false;
  private onStatusChange?: (connected: boolean) => void;
  private onReconnect?: () => void;

  constructor(options: WSManagerOptions) {
    this.handlers = options.handlers;
    this.onStatusChange = options.onStatusChange;
    this.onReconnect = options.onReconnect;
  }

  connect() {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;
    this.closed = false;
    const proto = location.protocol === "https:" ? "wss" : "ws";
    this.ws = new WebSocket(`${proto}://${location.host}/ws?token=${token}`);

    this.ws.onopen = () => {
      this.backoff = 1000; // connexion établie : réinitialiser le backoff
      this.onStatusChange?.(true);
      this.onReconnect?.();
    };

    this.ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.event === "ping") {
          this.ws?.send(JSON.stringify({ event: "pong" }));
          return;
        }
        const handler = this.handlers[msg.event];
        if (handler) handler(msg.data ?? {});
      } catch {
        /* ignore */
      }
    };

    this.ws.onclose = () => {
      this.onStatusChange?.(false);
      if (this.closed) return;
      setTimeout(() => this.connect(), this.backoff);
      this.backoff = Math.min(this.backoff * 2, MAX_BACKOFF_MS);
    };

    this.ws.onerror = () => this.ws?.close();
  }

  close() {
    this.closed = true;
    this.ws?.close();
  }
}
