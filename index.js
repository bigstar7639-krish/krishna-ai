const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const app = express();

let qrCode = null;
let pairingCode = null;
let isConnected = false;

async function startKrishnaAI(){
  const { state, saveCreds } = await useMultiFileAuthState('krishna-auth');
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ['Krishna AI', 'Chrome', '1.0']
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if(qr) qrCode = await QRCode.toDataURL(qr);
    if(connection === 'open'){
      isConnected = true;
      qrCode = null;
      pairingCode = null;
      console.log('KRISHNA AI CONNECTED!');
    }
    if(connection === 'close'){
      if(lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut){
        startKrishnaAI();
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  if(!sock.authState.creds.registered){
    const phoneNumber = '918870799204'; // UN NUMBER FIXED!
    setTimeout(async () => {
      try{
        const code = await sock.requestPairingCode(phoneNumber);
        pairingCode = code;
        console.log('PAIRING CODE FOR 8870799204:', code);
      }catch(err){
        console.log('Pairing error, use QR');
      }
    }, 3000);
  }

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if(!msg.message || msg.key.fromMe) return;
    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    const lower = text.toLowerCase();
    let reply = '';
    if(lower.includes('hi') || lower.includes('vanakkam')){
      reply = 'Vanakkam da! 🙏 Naan Krishna AI! Bill, QR, Photo ellam mudiyum! Enna venum?';
    } else if(lower.includes('bill')){
      const amt = text.match(/\d+/)?.[0] || '1000';
      reply = `🧾 KRISHNA STORE\nAmount: Rs.${amt}\nTotal: Rs.${Math.floor(amt*1.18)}\nNandri da!`;
    } else {
      reply = `🤖 KRISHNA AI: ${text} - Help pannuven da!`;
    }
    await sock.sendMessage(from, { text: reply });
  });
}

startKrishnaAI();

app.get('/', (req,res)=>{
  if(isConnected){
    res.send('<html><body style="background:#000;color:#0f0;text-align:center;padding:80px;font-family:sans-serif"><h1>✅ KRISHNA AI CONNECTED!<br>8870799204 READY!</h1><p>Bot Working 100%</p></body></html>');
  } else if(pairingCode){
    res.send(`
      <html><body style="background:#000;color:#fff;text-align:center;padding:20px;font-family:sans-serif">
      <h2 style="color:#0f0">🔢 KRISHNA AI - 8870799204</h2>
      <div style="background:#fff;color:#000;padding:25px;border-radius:15px;display:inline-block;margin:20px">
      <h1 style="font-size:50px;letter-spacing:12px;margin:0">${pairingCode}</h1>
      </div>
      <p style="background:#222;padding:15px;border-radius:10px;display:inline-block;text-align:left">
      WhatsApp la:<br>
      1. Settings > Linked Devices<br>
      2. Link a Device<br>
      3. Link with phone number<br>
      4. Enter this code
      </p>
      <p>Number: 8870799204</p>
      <script>setTimeout(()=>location.reload(),10000)</script>
      </body></html>
    `);
  } else if(qrCode){
    res.send(`<body style="background:#000;color:#fff;text-align:center;padding:20px"><h2 style="color:#0f0">SCAN QR - 8870799204</h2><img src="${qrCode}" style="width:300px;background:#fff;padding:15px;border-radius:15px"/><h1>${pairingCode||'Loading code...'}</h1><script>setTimeout(()=>location.reload(),5000)</script></body>`);
  } else {
    res.send('<h2 style="padding:100px;text-align:center">⏳ Generating code for 8870799204... 5 sec la refresh!</h2><script>setTimeout(()=>location.reload(),3000)</script>');
  }
});

app.listen(process.env.PORT||3000, ()=>console.log('KRISHNA AI LIVE 8870799204'));
