const express = require('express');
const fs = require('fs');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const app = express();

let pairCode = null;
let status = 'LOADING';

function deleteAuth(){
  try{
    if(fs.existsSync('auth')) fs.rmSync('auth',{recursive:true,force:true});
    if(fs.existsSync('auth_info_baileys')) fs.rmSync('auth_info_baileys',{recursive:true,force:true});
  }catch(e){}
}

async function startKrishna(){
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ['Chrome','Windows','10'],
    syncFullHistory: false
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (u)=>{
    const { connection, lastDisconnect } = u;
    if(connection==='open'){
      status='CONNECTED';
      console.log('✅ CONNECTED 8870799204');
    }
    if(connection==='close'){
      const code = lastDisconnect?.error?.output?.statusCode;
      if(code!== DisconnectReason.loggedOut){
        status='LOADING';
        startKrishna();
      }
    }
  });

  if(!state.creds.registered){
    status='WAITING_CODE';
    // 3 sec wait panni code edukkum - WhatsApp ku time venum
    setTimeout(async ()=>{
      try{
        pairCode = await sock.requestPairingCode('918870799204');
        status='CODE';
        console.log('NEW CODE:', pairCode);
      }catch(e){
        console.log('Code Error, retry...', e);
        status='LOADING';
        setTimeout(startKrishna, 3000);
      }
    }, 4000);
  }

  sock.ev.on('messages.upsert', async (m)=>{
    const msg=m.messages[0];
    if(!msg.message || msg.key.fromMe) return;
    await sock.sendMessage(msg.key.remoteJid, {text: `✅ KRISHNA AI ONLINE da! 🔥\n\nNee: ${msg.message.conversation || ''}`});
  });
}
startKrishna();

app.get('/', (req,res)=>{
  if(status==='CONNECTED'){
    res.send('<h1 style="background:#000;color:#0f0;padding:100px;text-align:center">✅ CONNECTED 8870799204<br>BOT LIVE!</h1>');
  } else if(status==='CODE' && pairCode){
    const clean = pairCode.replace(/-/g,'');
    res.send(`
    <body style="background:#000;color:#fff;text-align:center;padding:20px;font-family:Arial">
      <h2 style="color:#0f0">KRISHNA AI - 8870799204</h2>
      <div style="background:#fff;color:#000;padding:30px;border-radius:20px;display:inline-block;border:5px solid #0f0">
        <h1 style="font-size:55px;letter-spacing:10px;margin:0">${pairCode}</h1>
        <p style="color:green;font-weight:bold;font-size:20px">⏰ FAST TYPE - 15 SEC ONLY!</p>
      </div>
      <p>Type: <b style="font-size:24px;background:#222;color:#0f0;padding:8px 12px;border-radius:8px">${clean}</b></p>
      <p>WhatsApp 8870799204 la type pannanum!</p>
      <p><a href="/clear" style="color:orange">Clear Auth</a></p>
      <script>setTimeout(()=>location.reload(), 20000)</script>
    </body>
    `);
  } else {
    res.send('<h2 style="padding:80px;text-align:center">⚡ Krishna Starting... 5 sec wait<br><script>setTimeout(()=>location.reload(), 3000)</script></h2>');
  }
});

app.get('/clear', (req,res)=>{
  deleteAuth();
  res.send('<h1 style="padding:50px;text-align:center">✅ DELETED! Now Go Render > Manual Deploy > Clear cache & Deploy<br><br><a href="/">Home</a></h1>');
});

app.listen(process.env.PORT||3000, ()=>console.log('Server Started'));
