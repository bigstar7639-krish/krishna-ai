const express = require('express');
const fs = require('fs');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const app = express();

let CODE = "";
let STATUS = "Starting...";

async function start() {
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  
  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ["Krishna-Bot", "Chrome", "1.0"]
  });

  sock.ev.on('creds.update', saveCreds);

  if (!state.creds.registered) {
    // 5 sec kazhichu code edukkum
    setTimeout(async () => {
      try {
        CODE = await sock.requestPairingCode("918870799204");
        STATUS = "CODE READY";
        console.log("CODE:", CODE);
      } catch (e) {
        console.log("Code Fail:", e);
        STATUS = "Failed - Restarting";
        setTimeout(start, 3000);
      }
    }, 5000);
  } else {
    STATUS = "CONNECTED";
  }

  sock.ev.on('connection.update', ({connection}) => {
    if(connection === 'open') STATUS = "CONNECTED";
  });
}
start();

app.get('/', (req,res) => {
  if(CODE){
    res.send(`
      <center style="background:black;color:white;padding:30px;min-height:100vh">
      <h1 style="color:#00ff00">✅ KRISHNA BOT - PAIRING CODE</h1>
      <div style="background:white;color:black;padding:40px;border-radius:20px;margin:20px;border:6px solid lime">
        <h1 style="font-size:60px;letter-spacing:12px;margin:0">${CODE}</h1>
        <p style="color:red;font-weight:bold">10 SEC KULLA TYPE PANNU DA!</p>
      </div>
      <h2>Phone la: WhatsApp > Linked Devices > Link with phone number > ${CODE}</h2>
      <p>Number: 8870799204 la than type pannanum!</p>
      <a href="/clear" style="color:orange">Clear Auth</a>
      </center>
      <script>setTimeout(()=>location.reload(), 25000)</script>
    `);
  } else {
    res.send(`<center style="padding:100px"><h1>${STATUS}... Wait 5 sec</h1><script>setTimeout(()=>location.reload(),3000)</script></center>`);
  }
});

app.get('/clear', (req,res) => {
  try{ fs.rmSync('./auth',{recursive:true,force:true}) }catch{}
  CODE=""; STATUS="Cleared";
  res.send('<h1>✅ DELETED - Now Render > Manual Deploy > Clear cache & Deploy <br><a href="/">HOME</a></h1>');
});

app.listen(process.env.PORT || 3000);
