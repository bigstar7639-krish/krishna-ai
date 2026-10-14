const express = require('express');
const fs = require('fs');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const app = express();

let pairCode = null;
let displayTime = 60;
let status = 'LOADING';

function deleteAuth(){
  try{
    if(fs.existsSync('auth')) fs.rmSync('auth',{recursive:true,force:true});
    if(fs.existsSync('krishna-auth')) fs.rmSync('krishna-auth',{recursive:true,force:true});
    console.log('DELETED');
    return true;
  }catch(e){ return false; }
}

async function start(){
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ['Krishna AI','Chrome','1.0'],
    connectTimeoutMs: 10000,
    keepAliveIntervalMs: 10000
  });

  sock.ev.on('connection.update', async (u)=>{
    const { connection } = u;
    if(connection==='open'){
      status='CONNECTED';
      pairCode=null;
      console.log('CONNECTED 8870799204');
    }
    if(connection==='close' && u.lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut){
      status='LOADING';
      start();
    }
  });
  sock.ev.on('creds.update', saveCreds);

  if(!state.creds.registered){
    status='CODE';
    const makeCode = async () => {
      try{
        pairCode = await sock.requestPairingCode('918870799204');
        displayTime = 60;
        console.log('CODE:', pairCode);
      }catch(e){
        console.log('retry code...');
      }
    };
    setTimeout(makeCode, 2000);
    setInterval(makeCode, 25000);
    setInterval(()=>{ if(displayTime>0) displayTime--; },1000);
  }

  sock.ev.on('messages.upsert', async (m)=>{
    const msg=m.messages[0];
    if(!msg.message || msg.key.fromMe) return;
    const from=msg.key.remoteJid;
    const text=msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    await sock.sendMessage(from,{text:`✅ KRISHNA AI LIVE!\n\nNee sonna: ${text}\n\nBot Working Single Device 8870799204`});
  });
}
start();

app.get('/', (req,res)=>{
  if(status==='CONNECTED'){
    res.send('<h1 style="background:#000;color:#0f0;padding:100px;text-align:center">✅ CONNECTED 8870799204<br>BOT WORKING!</h1>');
  } else if(status==='CODE' && pairCode){
    res.send(`
    <html><head><title>Krishna AI</title><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="background:#000;color:#fff;text-align:center;padding:15px;font-family:Arial">
      <h2 style="color:#0f0">KRISHNA AI - 8870799204</h2>
      <div style="background:#fff;color:#000;padding:25px;border-radius:20px;display:inline-block;border:4px solid #0f0">
        <h1 style="font-size:52px;letter-spacing:8px;margin:0">${pairCode}</h1>
        <p style="color:${displayTime>15?'green':'red'};font-weight:bold;font-size:22px;margin:10px 0">⏰ ${displayTime}s</p>
        <p style="font-size:12px;color:#666">25 sec ku new code auto</p>
      </div>
      <p style="margin-top:15px">Type Without Dash: <b style="font-size:22px;background:#222;color:#0f0;padding:5px 10px;border-radius:5px">${pairCode.replace(/-/g,'')}</b></p>
      <p>WhatsApp > ⋮ > Linked Devices > Link a Device > Link with phone number</p>
      <p style="font-size:12px"><a href="/clear" style="color:orange">Clear Auth - Code varala na click</a></p>
      <script>setTimeout(()=>location.reload(),25000)</script>
    </body></html>
    `);
  } else {
    res.send('<h2 style="padding:80px;text-align:center">⚡ FAST CODE Generating... 2 sec wait<br><script>setTimeout(()=>location.reload(),2000)</script><br><a href="/clear">Clear Auth</a></h2>');
  }
});

app.get('/clear', (req,res)=>{
  deleteAuth();
  res.send('<h1 style="padding:50px;text-align:center">✅ AUTH DELETED!<br><br>Render Dashboard > Manual Deploy > Clear cache & Deploy<br><br><a href="/">Go Home</a></h1>');
});

app.listen(process.env.PORT||3000, ()=>console.log('Server running'));
