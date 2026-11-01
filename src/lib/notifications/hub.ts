import { API_BASE_URL } from '@/lib/api/config';
import { fetchHubToken, type NotificationItem } from '@/lib/api/notifications';

const RECORD_SEPARATOR = '\u001e';
const RECONNECT_MS = 5_000;

const itemListeners = new Set<(item: NotificationItem) => void>();
const countListeners = new Set<(count: number) => void>();
const stateListeners = new Set<(connected: boolean) => void>();

let socket: WebSocket | null = null;
let ownerId: number | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export function onNotification(listener: (item: NotificationItem) => void) {
  itemListeners.add(listener);
  return () => {
    itemListeners.delete(listener);
  };
}

export function onUnreadCount(listener: (count: number) => void) {
  countListeners.add(listener);
  return () => {
    countListeners.delete(listener);
  };
}

export function onHubState(listener: (connected: boolean) => void) {
  stateListeners.add(listener);
  return () => {
    stateListeners.delete(listener);
  };
}

function hubUrl(token: string) {
  const base = API_BASE_URL.replace(/^http/, 'ws');
  return `${base}/hubs/notifications?access_token=${encodeURIComponent(token)}`;
}

function dispatch(message: string) {
  let payload: unknown;
  try {
    payload = JSON.parse(message);
  } catch {
    return;
  }

  if (!payload || typeof payload !== 'object') return;
  const frame = payload as { type?: number; target?: string; arguments?: unknown[] };

  if (frame.type === 1 && frame.target) {
    if (frame.target === 'ReceiveNotification' && frame.arguments?.[0]) {
      const item = frame.arguments[0] as NotificationItem;
      itemListeners.forEach((listener) => listener(item));
    }
    if (frame.target === 'UpdateUnreadCount' && typeof frame.arguments?.[0] === 'number') {
      const count = frame.arguments[0] as number;
      countListeners.forEach((listener) => listener(count));
    }
    return;
  }

  // Keepalive ping from the server.
  if (frame.type === 6 && socket?.readyState === WebSocket.OPEN) {
    socket.send(`{"type":6}${RECORD_SEPARATOR}`);
  }
}

async function connect(userId: number) {
  if (ownerId !== userId || socket) return;

  ownerId = userId;
  const token = await fetchHubToken();
  if (ownerId !== userId) return;

  const next = new WebSocket(hubUrl(token));

  next.onopen = () => {
    next.send(`{"protocol":"json","version":1}${RECORD_SEPARATOR}`);
  };

  next.onmessage = (event) => {
    if (typeof event.data !== 'string') return;
    event.data
      .split(RECORD_SEPARATOR)
      .filter(Boolean)
      .forEach(dispatch);
  };

  next.onclose = () => {
    if (socket !== next) return;
    socket = null;
    stateListeners.forEach((listener) => listener(false));
    if (ownerId === userId) {
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        void connect(userId).catch(() => undefined);
      }, RECONNECT_MS);
    }
  };

  socket = next;
  stateListeners.forEach((listener) => listener(true));
}

export async function startNotificationHub(userId: number) {
  if (socket && ownerId === userId) return;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  ownerId = userId;
  await connect(userId);
}

export async function stopNotificationHub() {
  ownerId = null;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (socket) {
    const current = socket;
    socket = null;
    current.onclose = null;
    try {
      current.close();
    } catch {
      // Already closed.
    }
  }

  stateListeners.forEach((listener) => listener(false));
}
