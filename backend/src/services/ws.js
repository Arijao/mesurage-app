const { WebSocketServer } = require("ws");

let wss = null;
const clients = new Set();

/**
 * Attache le serveur WebSocket à un serveur HTTP/HTTPS existant,
 * via l'événement 'upgrade'. Peut être appelé plusieurs fois avec
 * des serveurs différents (HTTP et HTTPS) : les clients des deux
 * origines partagent le même Set, donc broadcast() touche tout le monde.
 */
function attachToServer(server) {
  if (!wss) {
    wss = new WebSocketServer({ noServer: true });
    wss.on("connection", (socket) => {
      clients.add(socket);
      socket.on("close", () => clients.delete(socket));
      socket.on("error", () => clients.delete(socket));
    });
  }

  server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });
}

/**
 * Diffuse un événement à tous les clients connectés (dashboard HTTP,
 * poste de scan HTTPS, etc.). Payload minimal volontaire : les clients
 * re-fetch leurs données via l'API existante, pas de duplication de logique.
 */
function broadcast(type, payload = {}) {
  const message = JSON.stringify({ type, ...payload });
  for (const socket of clients) {
    if (socket.readyState === socket.OPEN) {
      socket.send(message);
    }
  }
}

module.exports = { attachToServer, broadcast };