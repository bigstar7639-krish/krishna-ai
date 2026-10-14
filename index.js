const express = require('express');
const fs = require('fs');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const app = express();
app.use(express.json());

let sock;
let PAIR_CODE = "";
let IS_CONNECTED = false;

async function startBot() {
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('./auth_krishna_permanent');
  
  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ["KRISHNA-PERMANENT", "Chrome", "1.0"]
  });

  sock.ev.on('creds.update', saveCreds);

  // PERMANENT - ORU VAATI CONNECT PANNA POTHUM
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') {
      IS_CONNECTED = true;
      PAIR_CODE = "";
      console.log('✅ PERMANENT CONNECTED');
    }
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      IS_CONNECTED = false;
      if (shouldReconnect) startBot();
    }
  });

  // AUTO GENERATE CODE ONLY IF NOT CONNECTED
  if (!state.creds.registered) {
    setTimeout(async () => {
      if (!IS_CONNECTED) {
        try {
          PAIR_CODE = await sock.requestPairingCode("918870799204");
          console.log('PERMANENT CODE:', PAIR_CODE);
        } catch (e) { console.log(e); }
      }
    }, 5000);
  }
}
startBot();

// WEBSITE
app.get('/', (req, res) => {
  if (IS_CONNECTED) {
    res.send(`<body style="background:#000;color:#0f0;text-align:center;padding:50px;font-family:sans-serif"><h1>✅ PERMANENT CONNECTED DA!</h1><h2>Inime code vendaam - Bot online la than irukkum</h2><p>Render la Sleep aana kooda auto connect aayidum</p><a href="/logout" style="color:red">Logout / New Code</a></body>`);
  } else if (PAIR_CODE) {
    res.send(`<body style="background:#000;color:#fff;text-align:center;padding:20px"><h1 style="color:#0f0">PERMANENT CODE - ORU VAATI MATTUM</h1><div style="background:#fff;color:#000;padding:40px;font-size:70px;letter-spacing:15px;border-radius:20px;margin:20px;border:8px solid lime;font-weight:bold">${PAIR_CODE}</div><h2>WhatsApp > Linked Devices > Link with phone number > Itha type pannu</h2><p style="color:orange">Oru vaati type panna pothum - Inime kekathu!</p><script>setTimeout(()=>location.reload(),30000)</script></body>`);
  } else {
    res.send(`<h1 style="text-align:center;padding:100px">Generating Permanent Code... 5 sec wait <script>setTimeout(()=>location.reload(),3000)</script></h1>`);
  }
});

app.get('/logout', (req,res)=>{ try{fs.rmSync('./auth_krishna_permanent',{recursive:true,force:true})}catch{} PAIR_CODE=""; IS_CONNECTED=false; res.redirect('/'); setTimeout(()=>startBot(),2000); });

app.listen(process.env.PORT || 3000);
