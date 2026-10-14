const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const app = express();

let qrImg = null;
let pairCode = null;
let sockGlobal = null;
let countdown = 25;

async function start(){
  const { state, saveCreds } = await useMultiFileAuthState('krishna-auth');
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ['Krishna AI','Chrome','1.0']
  });
  sockGlobal = sock;

  sock.ev.on('connection.update', async (u)=>{
    const { connection, qr, lastDisconnect } = u;
    if(qr){
      qrImg = await QRCode.toDataURL(qr);
      console.log('QR READY');
    }
    if(connection==='open'){
      console.log('CONNECTED 8870799204');
    }
    if(connection==='close' && lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut){
      start();
    }
  });
  sock.ev.on('creds.update', saveCreds);

  // PAIRING CODE AUTO GENERATE EVERY 25 SEC
  if(!state.creds.registered){
    const genCode = async () => {
      try{
        const code = await sock.requestPairingCode('918870799204');
        pairCode = code;
        countdown = 25;
        console.log('NEW CODE:', code);
      }catch(e){
        console.log('Code gen wait...');
      }
    };
    await genCode();
    setInterval(genCode, 25000); // Every 25 sec new code
    setInterval(()=>{ if(countdown>0) countdown--; }, 1000);
  }

  sock.ev.on('messages.upsert', async (m)=>{
    const msg=m.messages[0]; if(!msg.message||msg.key.fromMe) return;
    const from=msg.key.remoteJid;
    const text=msg.message.conversation||msg.message.extendedTextMessage?.text||'';
    await sock.sendMessage(from,{text:`✅ KRISHNA AI LIVE! Nee: ${text}`});
  });
}
start();

app.get('/', (req,res)=>{
  res.send(`
  <html><head><meta http-equiv="refresh" content="25"></head>
  <body style="background:#000;color:#fff;text-align:center;padding:15px;font-family:sans-serif">
    <h2 style="color:#0f0">🔥 KRISHNA AI - 8870799204</h2>
    ${pairCode? `
    <div style="background:#fff;color:#000;padding:20px;border-radius:15px;display:inline-block;margin:10px">
      <h1 style="font-size:48px;letter-spacing:10px;margin:0">${pairCode}</h1>
      <p style="color:red;font-weight:bold;margin:5px 0">⏰ ${countdown} sec la new code varum!</p>
    </div>
    <p>WhatsApp > Linked Devices > Link with phone number > Fast type pannu!</p>
    ` : ''}
    ${qrImg? `<p>OR QR Scan:</p><img src="${qrImg}" style="width:260px;background:#fff;padding:12px;border-radius:15px"/>` : '<p>Loading code...</p>'}
    <p style="color:#aaa;margin-top:15px">Auto refresh every 25 sec - Page ah close panna koodathu!</p>
    <p style="color:#0f0">Number: 8870799204</p>
    <script>
      let c=${countdown};
      setInterval(()=>{ c--; document.querySelector('p').innerHTML = '⏰ '+c+' sec la new code varum!'; },1000);
    </script>
  </body></html>
  `);
});

app.listen(process.env.PORT||3000);
