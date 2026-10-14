const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const app = express();

let qrCode = null;
let connected = false;

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({ auth: state, browser: ['Krishna AI','Chrome','1.0'] });

  sock.ev.on('connection.update', async (update) => {
    const { qr, connection, lastDisconnect } = update;
    if(qr){
      qrCode = await QRCode.toDataURL(qr);
    }
    if(connection === 'open'){
      connected = true;
      console.log('KRISHNA AI CONNECTED!');
    }
    if(connection === 'close'){
      if(lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut){
        startBot();
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if(!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    const lower = text.toLowerCase();
    let reply = '';

    if(lower.includes('hi') || lower.includes('hello') || lower.includes('vanakkam')){
      reply = 'Hi! 🙏 Naan Krishna AI! Bill, QR, Photo, Code ellam mudiyum! Enna venum sollu?';
    } else if(lower.includes('bill')){
      const amt = text.match(/\d+/)?.[0] || '1000';
      const total = Math.floor(parseInt(amt)*1.18);
      reply = `🧾 BILL READY!\n\nKRISHNA STORE - CHENNAI\nAmount: Rs.${amt}\nTotal with GST: Rs.${total}\n\nNandri!`;
    } else if(lower.includes('qr')){
      reply = `📱 QR LINK:\nhttps://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
    } else {
      reply = `🤖 KRISHNA AI:\nNee sonna: ${text}\n\nHelp pannuven! Bill, QR, Photo sollu!`;
    }

    await sock.sendMessage(from, { text: reply });
  });
}

startBot();

app.get('/', (req,res)=>{
  if(connected){
    res.send('<h1 style="background:#000;color:#0f0;padding:100px;text-align:center;font-family:sans-serif">✅ KRISHNA AI CONNECTED!<br><br>WhatsApp Bot Ready!</h1>');
  } else if(qrCode){
    res.send(`<html><body style="background:#000;color:#fff;text-align:center;padding:20px;font-family:sans-serif"><h2 style="color:#0f0">📱 KRISHNA AI - SCAN QR</h2><p>WhatsApp > Linked Devices > Link a Device</p><img src="${qrCode}" style="width:320px;background:#fff;padding:15px;border-radius:15px"/><script>setTimeout(()=>location.reload(),5000)</script></body></html>`);
  } else {
    res.send('<h2 style="padding:100px;text-align:center">⏳ QR Loading... refresh pannu!</h2><script>setTimeout(()=>location.reload(),3000)</script>');
  }
});

app.listen(process.env.PORT||3000, ()=>console.log('KRISHNA AI LIVE'));
