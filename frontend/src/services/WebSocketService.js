import { WS_BASE_URL, SOCKET_EVENTS } from '../config';
import EventEmitter from 'events';

class WebSocketService extends EventEmitter {
  constructor() {
    super();
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 5000; // 5 seconds
    this.pingInterval = 30000; // 30 seconds
    this.pingTimer = null;
    this.messageQueue = [];
    this.eventHandlers = new Map();
    this.autoReconnect = true;
  }

  /**
   * Initialize WebSocket connection
   * @param {string} token - Authentication token
   * @param {boolean} [autoReconnect=true] - Whether to automatically reconnect on disconnect
   */
  connect(token, autoReconnect = true) {
    if (this.socket) {
      this.disconnect();
    }

    this.autoReconnect = autoReconnect;
    this.token = token;
    
    try {
      // Create WebSocket connection with auth token
      this.socket = new WebSocket(`${WS_BASE_URL}?token=${encodeURIComponent(token)}`);
      
      // Set up event listeners
      this.setupEventListeners();
      
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleConnectionError(error);
    }
  }

  /**
   * Set up WebSocket event listeners
   */
  setupEventListeners() {
    if (!this.socket) return;

    // Connection established
    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit(SOCKET_EVENTS.CONNECT);
      
      // Start ping interval to keep connection alive
      this.startPing();
      
      // Process any queued messages
      this.processMessageQueue();
    };

    // Message received
    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleIncomingMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    // Connection closed
    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.isConnected = false;
      this.emit(SOCKET_EVENTS.DISCONNECT, { code: event.code, reason: event.reason });
      
      // Stop ping interval
      this.stopPing();
      
      // Attempt to reconnect if needed
      if (this.autoReconnect && (event.code !== 1000 || !event.wasClean)) {
        this.attemptReconnect();
      }
    };

    // Connection error
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit(SOCKET_EVENTS.CONNECT_ERROR, error);
      this.handleConnectionError(error);
    };
  }

  /**
   * Handle incoming WebSocket messages
   * @param {Object} message - The received message
   */
  handleIncomingMessage(message) {
    const { event, data } = message;
    
    // Emit the event with the data
    this.emit(event, data);
    
    // Also emit a generic message event for all messages
    if (event !== SOCKET_EVENTS.MESSAGE) {
      this.emit(SOCKET_EVENTS.MESSAGE, { event, data });
    }
    
    // Call any registered event handlers
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      handlers.forEach(handler => handler(data));
    }
  }

  /**
   * Send a message through the WebSocket
   * @param {string} event - Event name
   * @param {Object} data - Data to send
   * @param {Function} [ack] - Callback for acknowledgment
   */
  send(event, data, ack) {
    const message = { event, data };
    
    // Add ack callback if provided
    if (ack && typeof ack === 'function') {
      const ackId = `ack_${Date.now()}`;
      message.ackId = ackId;
      
      // Set up a one-time listener for the ack
      const ackHandler = (response) => {
        if (response.ackId === ackId) {
          this.off(SOCKET_EVENTS.MESSAGE, ackHandler);
          ack(response.data);
        }
      };
      
      this.on(SOCKET_EVENTS.MESSAGE, ackHandler);
      
      // Set a timeout for the ack
      setTimeout(() => {
        this.off(SOCKET_EVENTS.MESSAGE, ackHandler);
      }, 10000); // 10 second timeout
    }
    
    // Send the message or queue it if not connected
    if (this.isConnected) {
      this.socket.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  /**
   * Process any queued messages
   */
  processMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      this.socket.send(JSON.stringify(message));
    }
  }

  /**
   * Register an event handler
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   */
  onEvent(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);
    
    // Return a function to unregister the handler
    return () => this.offEvent(event, handler);
  }

  /**
   * Unregister an event handler
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function to remove
   */
  offEvent(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      handlers.delete(handler);
      
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  /**
   * Start ping interval to keep connection alive
   */
  startPing() {
    this.stopPing();
    
    this.pingTimer = setInterval(() => {
      if (this.isConnected) {
        this.send('ping', { timestamp: Date.now() });
      }
    }, this.pingInterval);
  }

  /**
   * Stop ping interval
   */
  stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  /**
   * Handle connection errors
   * @param {Error} error - The error that occurred
   */
  handleConnectionError(error) {
    this.emit('error', error);
    
    if (this.autoReconnect) {
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('reconnect_failed');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.autoReconnect && !this.isConnected) {
        this.connect(this.token, this.autoReconnect);
      }
    }, delay);
  }

  /**
   * Disconnect the WebSocket
   * @param {number} [code=1000] - Close code
   * @param {string} [reason] - Close reason
   */
  disconnect(code = 1000, reason) {
    this.autoReconnect = false;
    
    if (this.socket) {
      this.socket.close(code, reason);
      this.socket = null;
    }
    
    this.stopPing();
    this.isConnected = false;
    this.messageQueue = [];
    this.eventHandlers.clear();
  }

  /**
   * Check if the WebSocket is connected
   * @returns {boolean} True if connected, false otherwise
   */
  isConnected() {
    return this.isConnected;
  }
}

// Create a singleton instance
export const webSocketService = new WebSocketService();

export default WebSocketService;
