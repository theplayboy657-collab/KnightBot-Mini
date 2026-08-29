const fs = require('fs');
const path = require('path');
const { default: makeWASocket, useSingleFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');

const SESSIONS_DIR = path.join(__dirname, '..', 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

const agents = new Map(); // token -> { sock, status, qr, number, createdAt, jid }

function createToken() {
  return (Date.now().toString(36) + Math.random().toString(36).slice(2,10));
}

async function createAgentForNumber(number, token = null) {
  token = token || createToken();
  if (agents.has(token)) return agents.get(token);

  const authFile = path.join(SESSIONS_DIR, `${token}.json`);
  const { state, saveCreds } = useSingleFileAuthState(authFile);

  const sock = makeWASocket({ auth: state, printQRInTerminal: false });

  const agent = { sock, status: 'initializing', qr: null, number, token, createdAt: Date.now(), jid: null };
  agents.set(token, agent);

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr, user } = update;
    if (qr) {
      agent.qr = qr; // raw string
      agent.status = 'qr';
    }
    if (connection === 'open') {
      agent.status = 'connected';
      try { agent.jid = sock?.user?.id || null; } catch (e) {}
    }
    if (connection === 'close') {
      agent.status = 'closed';
      agent.lastDisconnect = lastDisconnect;
    }
  });

  return agent;
}

function getAgent(token) {
  return agents.get(token) || null;
}

async function toDataURLFromQrString(qrString) {
  try {
    const dataUrl = await qrcode.toDataURL(qrString);
    return dataUrl;
  } catch (e) {
    return null;
  }
}

module.exports = { createAgentForNumber, getAgent, toDataURLFromQrString };
