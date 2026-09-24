// server.js — Serveur local professionnel INEAS Auto-Évaluation
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Charger les variables d'environnement depuis le fichier .env à la racine
try {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
} catch (e) {
  if (process.loadEnvFile) {
    try {
      process.loadEnvFile(path.join(__dirname, '../.env'));
    } catch (_) {}
  }
}

let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  nodemailer = null;
}

const PORT = process.env.PORT || 3001;
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const DATA_DIR = path.resolve(__dirname, '../data');

const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').trim();
const DEFAULT_MODEL = "openai/gpt-oss-120b";
const SECRET_KEY = process.env.JWT_SECRET || 'ineas_secret_key_2026';

const EVALUATIONS_FILE = path.join(DATA_DIR, 'evaluations.json');
const HOSPITALS_FILE = path.join(DATA_DIR, 'hospitals.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf'
};

async function sendRealEmail({ to, subject, username, password, hospitalName }) {
  if (!nodemailer) {
    console.log(`⚠️ [EMAIL NOTICE] Nodemailer non disponible pour ${to}`);
    return { success: false, error: "Module Nodemailer non chargé" };
  }

  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465');
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || '';
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_PASS || '';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #0f172a;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background: #0f172a; color: #ffffff; padding: 20px 24px; text-align: center; border-bottom: 4px solid #1e3a8a;">
          <h2 style="margin: 0; font-size: 1.25rem;">Instance Nationale d'Évaluation et d'Accréditation en Santé (INEAS)</h2>
          <p style="margin: 4px 0 0; font-size: 0.85rem; color: #cbd5e1;">Portail Officiel d'Auto-Évaluation GRI</p>
        </div>
        <div style="padding: 32px 24px;">
          <h3 style="color: #1e3a8a; margin-top: 0;">Bienvenue, ${hospitalName}</h3>
          <p style="font-size: 0.95rem; line-height: 1.6; color: #334155;">
            Votre établissement de santé a été officiellement enregistré sur le portail national d'accréditation INEAS. Vous disposez de <strong>15 jours</strong> à compter de cet enregistrement pour réaliser votre auto-évaluation.
          </p>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h4 style="margin: 0 0 12px; color: #1e40af; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.05em;">🔑 Vos Identifiants Officiels d'Accès :</h4>
            <p style="margin: 6px 0; font-size: 0.95rem;"><strong>Identifiant (Username) :</strong> <code style="background: #dbeafe; color: #1e40af; padding: 3px 8px; border-radius: 4px; font-weight: bold;">${username}</code></p>
            <p style="margin: 6px 0; font-size: 0.95rem;"><strong>Mot de Passe Initial :</strong> <code style="background: #dbeafe; color: #1e40af; padding: 3px 8px; border-radius: 4px; font-weight: bold;">${password}</code></p>
          </div>
          <p style="text-align: center; margin: 28px 0 12px;">
            <a href="http://localhost:3001/login.html" style="background: #1e3a8a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; display: inline-block;">Accéder au Portail de Connexion →</a>
          </p>
        </div>
        <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 0.775rem; color: #64748b; border-top: 1px solid #e2e8f0;">
          Instance Nationale d'Évaluation et d'Accréditation en Santé (INEAS) © 2026
        </div>
      </div>
    </div>
  `;

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false }
    });

    const info = await transporter.sendMail({
      from: `"INEAS Accréditation" <${smtpUser}>`,
      to,
      subject,
      text: `INEAS — Identifiants d'accès pour ${hospitalName}\nIdentifiant: ${username}\nMot de passe: ${password}\nAccès: http://localhost:3001/login.html`,
      html: htmlContent
    });

    console.log(`\n✔ [SMTP REAL EMAIL SENT] ID: ${info.messageId} -> ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`\n⚠️ [SMTP EMAIL NOTICE] ${err.message}`);
    return { success: false, error: err.message };
  }
}

function readUsersFile() {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeUsersFile(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function sendJson(res, statusCode, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function serveStaticFile(req, res) {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/login.html';
  if (urlPath === '/logo_ineas.png') urlPath = '/assets/logo_ineas.png';

  const safePath = path.normalize(urlPath).replace(/^(\.{2}[\/\\]+)+/, '');
  const filePath = path.resolve(PUBLIC_DIR, '.' + safePath);

  // Sécurité anti-traversée de dossier
  const relative = path.relative(PUBLIC_DIR, filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 - Fichier non trouvé : ' + safePath);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Content-Length': data.length
    });
    if (req.method === 'HEAD') {
      res.end();
    } else {
      res.end(data);
    }
  });
}

function generateToken(user) {
  const payload = JSON.stringify({
    username: user.username,
    role: user.role,
    hospitalId: user.hospitalId || '',
    name: user.name || user.username,
    exp: Date.now() + (8 * 60 * 60 * 1000)
  });
  const base64Payload = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(base64Payload).digest('base64url');
  return `${base64Payload}.${signature}`;
}

function verifyToken(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [base64Payload, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', SECRET_KEY).update(base64Payload).digest('base64url');

  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function getHospitalDeadlineInfo(createdAtStr) {
  const createdAt = createdAtStr ? new Date(createdAtStr) : new Date();
  const deadlineDate = new Date(createdAt.getTime() + (15 * 24 * 60 * 60 * 1000));
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isExpired = diffMs < 0;
  return {
    createdAt: createdAt.toISOString(),
    deadlineDate: deadlineDate.toISOString(),
    daysRemaining,
    isExpired
  };
}

function readHospitalsFile() {
  try {
    if (!fs.existsSync(HOSPITALS_FILE)) return [];
    return JSON.parse(fs.readFileSync(HOSPITALS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeHospitalsFile(data) {
  fs.writeFileSync(HOSPITALS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function readEvaluationsFile() {
  try {
    if (!fs.existsSync(EVALUATIONS_FILE)) return {};
    return JSON.parse(fs.readFileSync(EVALUATIONS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeEvaluationsFile(data) {
  fs.writeFileSync(EVALUATIONS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function handleLogin(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    let payload;
    try { payload = JSON.parse(body); } catch { return sendJson(res, 400, { error: 'Format JSON invalide.' }); }
    const { username, password } = payload;
    const users = readUsersFile();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return sendJson(res, 401, { error: 'Identifiants ou mot de passe incorrects.' });

    const token = generateToken(user);
    return sendJson(res, 200, {
      token,
      role: user.role,
      username: user.username,
      hospitalId: user.hospitalId || '',
      name: user.name
    });
  });
}

function handleHospitalsList(req, res) {
  const decoded = verifyToken(req);
  if (!decoded || decoded.role !== 'admin') {
    return sendJson(res, 403, { error: 'Accès réservé aux administrateurs.' });
  }

  const hospitals = readHospitalsFile();
  const evaluations = readEvaluationsFile();

  const enriched = hospitals.map(h => {
    const evalData = evaluations[h.id] || evaluations[h.name] || {};
    const evalResults = evalData.evalResults || {};

    let ouiCount = 0;
    let totalEvaluated = 0;

    Object.keys(evalResults).forEach(refKey => {
      const items = evalResults[refKey] || [];
      items.forEach(item => {
        totalEvaluated++;
        if (item.existant === 'Oui') ouiCount++;
      });
    });

    let calculatedLevel = h.level || 1;
    if (totalEvaluated > 0) {
      const ratio = ouiCount / Math.max(totalEvaluated, 1);
      calculatedLevel = Math.min(5, Math.max(1, Math.ceil(ratio * 5)));
    }

    const deadlineInfo = getHospitalDeadlineInfo(h.createdAt);

    return {
      ...h,
      ...deadlineInfo,
      level: calculatedLevel,
      evaluatedRefs: Object.keys(evalResults).length,
      ouiCount
    };
  });

  return sendJson(res, 200, enriched);
}

function handleAddHospital(req, res) {
  const decoded = verifyToken(req);
  if (!decoded || decoded.role !== 'admin') {
    return sendJson(res, 403, { error: 'Accès réservé aux administrateurs.' });
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    let payload;
    try { payload = JSON.parse(body); } catch { return sendJson(res, 400, { error: 'JSON invalide.' }); }

    if (!payload.name || !payload.name.trim()) {
      return sendJson(res, 400, { error: "Le nom de l'établissement est requis." });
    }
    if (!payload.username || !payload.username.trim()) {
      return sendJson(res, 400, { error: "L'identifiant d'accès (username) est requis." });
    }
    if (!payload.password || !payload.password.trim()) {
      return sendJson(res, 400, { error: "Le mot de passe d'accès est requis." });
    }
    if (!payload.email || !payload.email.trim()) {
      return sendJson(res, 400, { error: "L'adresse e-mail officielle est requise." });
    }

    const users = readUsersFile();
    if (users.find(u => u.username.toLowerCase() === payload.username.trim().toLowerCase())) {
      return sendJson(res, 400, { error: `L'identifiant "${payload.username}" est déjà utilisé.` });
    }

    const hospitals = readHospitalsFile();
    const newId = 'h' + (hospitals.length + 1) + '_' + Date.now().toString(36);
    const newHospital = {
      id: payload.id || newId,
      name: payload.name.trim(),
      level: payload.level || 1,
      city: payload.city || 'Non spécifiée',
      type: payload.type || 'Établissement de Santé',
      createdAt: new Date().toISOString()
    };

    hospitals.push(newHospital);
    writeHospitalsFile(hospitals);

    const newUser = {
      username: payload.username.trim(),
      password: payload.password.trim(),
      role: 'hospital',
      hospitalId: newHospital.id,
      name: newHospital.name,
      email: payload.email.trim()
    };
    users.push(newUser);
    writeUsersFile(users);

    const emailResult = await sendRealEmail({
      to: newUser.email,
      subject: `[INEAS] Vos identifiants officiels d'accès pour ${newUser.name}`,
      username: newUser.username,
      password: newUser.password,
      hospitalName: newUser.name
    });

    return sendJson(res, 201, {
      ...newHospital,
      ...getHospitalDeadlineInfo(newHospital.createdAt),
      username: newUser.username,
      email: newUser.email,
      password: newUser.password,
      emailSent: emailResult.success,
      emailError: emailResult.error || null,
      message: emailResult.success
        ? `Établissement et compte enregistrés avec succès. E-mail réel transmis à ${newUser.email}`
        : `Établissement enregistré. Note e-mail (${emailResult.error || 'SMTP à configurer'}). Identifiants créés.`
    });
  });
}

function handleDeleteHospital(req, res, hospitalId) {
  const decoded = verifyToken(req);
  if (!decoded || decoded.role !== 'admin') {
    return sendJson(res, 403, { error: 'Accès réservé aux administrateurs.' });
  }

  if (!hospitalId) return sendJson(res, 400, { error: 'ID hôpital manquant.' });

  // Supprimer de hospitals.json
  const hospitals = readHospitalsFile();
  const idx = hospitals.findIndex(h => h.id === hospitalId);
  if (idx === -1) return sendJson(res, 404, { error: 'Établissement introuvable.' });
  const deleted = hospitals.splice(idx, 1)[0];
  writeHospitalsFile(hospitals);

  // Supprimer le compte utilisateur associé
  const users = readUsersFile();
  const filteredUsers = users.filter(u => u.hospitalId !== hospitalId);
  writeUsersFile(filteredUsers);

  // Supprimer les évaluations associées
  const evaluations = readEvaluationsFile();
  if (evaluations[hospitalId]) delete evaluations[hospitalId];
  // Aussi par nom au cas où
  if (deleted.name && evaluations[deleted.name]) delete evaluations[deleted.name];
  writeEvaluationsFile(evaluations);

  console.log(`[ADMIN] Établissement supprimé: ${deleted.name} (${hospitalId})`);
  return sendJson(res, 200, { success: true, message: `Établissement "${deleted.name}" supprimé avec succès.` });
}

function handleHospitalInfo(req, res, hospitalId) {
  const decoded = verifyToken(req);
  if (!decoded) return sendJson(res, 401, { error: 'Session non valide.' });

  if (decoded.role === 'hospital' && decoded.hospitalId && decoded.hospitalId !== hospitalId) {
    return sendJson(res, 403, { error: 'Accès non autorisé à cet hôpital.' });
  }

  const hospitals = readHospitalsFile();
  const hospital = hospitals.find(h => h.id === hospitalId || h.name.toLowerCase() === decodeURIComponent(hospitalId).toLowerCase());

  if (!hospital) {
    const defaultCreatedAt = new Date().toISOString();
    return sendJson(res, 200, { id: hospitalId, name: decodeURIComponent(hospitalId), level: 1, ...getHospitalDeadlineInfo(defaultCreatedAt) });
  }

  const deadlineInfo = getHospitalDeadlineInfo(hospital.createdAt);
  return sendJson(res, 200, { ...hospital, ...deadlineInfo });
}

function handleGetEvaluation(req, res, hospitalId) {
  const decoded = verifyToken(req);
  if (!decoded) return sendJson(res, 401, { error: 'Session non valide.' });

  const evaluations = readEvaluationsFile();
  const data = evaluations[hospitalId] || evaluations[decodeURIComponent(hospitalId)] || {
    sharedDocs: {},
    evalResults: {},
    syntheses: {},
    finalReport: null,
    discussions: []
  };

  return sendJson(res, 200, data);
}

function handleSaveEvaluation(req, res, hospitalId) {
  const decoded = verifyToken(req);
  if (!decoded) return sendJson(res, 401, { error: 'Session non valide.' });

  const hospitals = readHospitalsFile();
  const hospital = hospitals.find(h => h.id === hospitalId || h.name.toLowerCase() === decodeURIComponent(hospitalId).toLowerCase());

  if (decoded.role === 'hospital' && hospital) {
    const deadlineInfo = getHospitalDeadlineInfo(hospital.createdAt);
    if (deadlineInfo.isExpired) {
      return sendJson(res, 403, { error: "Le délai de 15 jours pour réaliser l'auto-évaluation est expiré. Les modifications ne sont plus autorisées." });
    }
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    let payload;
    try { payload = JSON.parse(body); } catch { return sendJson(res, 400, { error: 'JSON invalide.' }); }

    const evaluations = readEvaluationsFile();
    evaluations[hospitalId] = payload;
    writeEvaluationsFile(evaluations);

    return sendJson(res, 200, { success: true, message: 'Évaluation sauvegardée sur le serveur.' });
  });
}

function handleGetDiscussions(req, res, hospitalId) {
  const decoded = verifyToken(req);
  if (!decoded) return sendJson(res, 401, { error: 'Session non valide.' });

  const evaluations = readEvaluationsFile();
  const evalData = evaluations[hospitalId] || evaluations[decodeURIComponent(hospitalId)] || {};
  return sendJson(res, 200, evalData.discussions || []);
}

function handleAddDiscussion(req, res, hospitalId) {
  const decoded = verifyToken(req);
  if (!decoded) return sendJson(res, 401, { error: 'Session non valide.' });

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    let payload;
    try { payload = JSON.parse(body); } catch { return sendJson(res, 400, { error: 'JSON invalide.' }); }

    if (!payload.text || !payload.text.trim()) {
      return sendJson(res, 400, { error: 'Le message ne peut pas être vide.' });
    }

    const evaluations = readEvaluationsFile();
    const targetKey = evaluations[hospitalId] ? hospitalId : decodeURIComponent(hospitalId);
    if (!evaluations[targetKey]) {
      evaluations[targetKey] = { sharedDocs: {}, evalResults: {}, syntheses: {}, finalReport: null, discussions: [] };
    }
    if (!evaluations[targetKey].discussions) {
      evaluations[targetKey].discussions = [];
    }

    const newMessage = {
      id: 'msg_' + Date.now().toString(36),
      senderRole: decoded.role,
      senderName: decoded.name || (decoded.role === 'admin' ? 'Administrateur INEAS' : 'Établissement'),
      text: payload.text.trim(),
      timestamp: new Date().toISOString()
    };

    evaluations[targetKey].discussions.push(newMessage);
    writeEvaluationsFile(evaluations);

    return sendJson(res, 201, newMessage);
  });
}

function handleAdminDiscussions(req, res) {
  const decoded = verifyToken(req);
  if (!decoded || decoded.role !== 'admin') {
    return sendJson(res, 403, { error: 'Accès réservé aux administrateurs.' });
  }

  const evaluations = readEvaluationsFile();
  const hospitals = readHospitalsFile();
  const summary = [];
  let totalHospitalMessages = 0;

  hospitals.forEach(h => {
    const evalData = evaluations[h.id] || evaluations[h.name] || {};
    const discussions = evalData.discussions || [];
    const hospitalMsgs = discussions.filter(m => m.senderRole === 'hospital');
    totalHospitalMessages += hospitalMsgs.length;

    summary.push({
      hospitalId: h.id,
      hospitalName: h.name,
      totalMessages: discussions.length,
      hospitalMessageCount: hospitalMsgs.length,
      lastMessage: discussions.length > 0 ? discussions[discussions.length - 1] : null,
      discussions: discussions
    });
  });

  return sendJson(res, 200, {
    totalHospitalMessages,
    hospitals: summary
  });
}

function handleApiMessages(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (e) {
      return sendJson(res, 400, { error: 'Corps de requête JSON invalide.' });
    }

    const apiKey = (process.env.GROQ_API_KEY || GROQ_API_KEY || '').trim();
    if (!apiKey) {
      return sendJson(res, 400, { error: "Aucune clé API Groq configurée." });
    }

    const messages = [];
    if (payload.system) messages.push({ role: 'system', content: payload.system });
    (payload.messages || []).forEach(m => messages.push(m));

    const groqBody = JSON.stringify({
      model: payload.model || DEFAULT_MODEL,
      messages: messages,
      max_tokens: payload.max_tokens || 1024,
      temperature: 0.3
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
        'Content-Length': Buffer.byteLength(groqBody)
      }
    };

    const upstreamReq = https.request(options, upstreamRes => {
      let responseBody = '';
      upstreamRes.on('data', chunk => { responseBody += chunk; });
      upstreamRes.on('end', () => {
        if (upstreamRes.statusCode >= 400) {
          let errMsg = 'Erreur API Groq (' + upstreamRes.statusCode + ')';
          try {
            const parsed = JSON.parse(responseBody);
            if (parsed.error && parsed.error.message) errMsg = parsed.error.message;
          } catch (_) {}
          console.error('[GROQ ERROR ' + upstreamRes.statusCode + ']', responseBody);
          return sendJson(res, upstreamRes.statusCode, { error: errMsg });
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(responseBody);
      });
    });

    upstreamReq.on('error', err => {
      sendJson(res, 502, { error: "Impossible de joindre l'API Groq : " + err.message });
    });

    upstreamReq.write(groqBody);
    upstreamReq.end();
  });
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const cleanUrl = req.url.split('?')[0];

  if (req.method === 'POST' && cleanUrl === '/api/login') {
    handleLogin(req, res);
    return;
  }
  if (req.method === 'GET' && cleanUrl === '/api/hospitals') {
    handleHospitalsList(req, res);
    return;
  }
  if (req.method === 'POST' && cleanUrl === '/api/hospitals') {
    handleAddHospital(req, res);
    return;
  }
  if (req.method === 'DELETE' && cleanUrl.startsWith('/api/hospitals/')) {
    const id = cleanUrl.split('/')[3];
    handleDeleteHospital(req, res, id);
    return;
  }
  if (req.method === 'GET' && cleanUrl.startsWith('/api/hospital/')) {
    const id = cleanUrl.split('/')[3];
    handleHospitalInfo(req, res, id);
    return;
  }
  if (req.method === 'GET' && cleanUrl.startsWith('/api/evaluations/')) {
    const id = cleanUrl.split('/')[3];
    handleGetEvaluation(req, res, id);
    return;
  }
  if (req.method === 'POST' && cleanUrl.startsWith('/api/evaluations/')) {
    const id = cleanUrl.split('/')[3];
    handleSaveEvaluation(req, res, id);
    return;
  }
  if (req.method === 'GET' && cleanUrl === '/api/admin/discussions') {
    handleAdminDiscussions(req, res);
    return;
  }
  if (req.method === 'GET' && cleanUrl.startsWith('/api/discussions/')) {
    const id = cleanUrl.split('/')[3];
    handleGetDiscussions(req, res, id);
    return;
  }
  if (req.method === 'POST' && cleanUrl.startsWith('/api/discussions/')) {
    const id = cleanUrl.split('/')[3];
    handleAddDiscussion(req, res, id);
    return;
  }
  if (req.method === 'POST' && cleanUrl === '/api/messages') {
    handleApiMessages(req, res);
    return;
  }
  if (req.method === 'GET' || req.method === 'HEAD') {
    serveStaticFile(req, res);
    return;
  }

  if (cleanUrl.startsWith('/api/')) {
    sendJson(res, 405, { error: 'Méthode non autorisée pour cette API.' });
  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Méthode non autorisée');
  }
});

server.listen(PORT, () => {
  console.log(`\n✔ Serveur GRI Auto-évaluation démarré sur http://localhost:${PORT}`);
  console.log(`  → Ouvrez http://localhost:${PORT}/login.html dans votre navigateur\n`);
});
