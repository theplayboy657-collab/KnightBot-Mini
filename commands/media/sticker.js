/**
 * Sticker Command - Convert image/video to sticker
 */

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { createStickerBuffer } = require('../../utils/sticker');

module.exports = {
  name: 'sticker',
  aliases: ['stick', 'mksticker'],
  category: 'media',
  description: 'Convert image or video to sticker',
  usage: '.sticker (reply to image/video)',
  
  async execute(sock, msg, args, extra) {
    try {
      const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quotedMessage) return extra.reply('📷 Please reply to an image or video with .sticker');

      const isImage = !!quotedMessage.imageMessage;
      const isVideo = !!quotedMessage.videoMessage;
      if (!isImage && !isVideo) return extra.reply('❌ This message is neither an image nor a video.');

      const ctx = msg.message.extendedTextMessage?.contextInfo;
      const chatId = extra.from;
      const fakeMsg = { key: { remoteJid: chatId, id: ctx.stanzaId, participant: ctx.participant }, message: quotedMessage };

      try {
        const buffer = await downloadMediaMessage(fakeMsg, 'buffer', {});
        if (!buffer) return extra.reply('❌ Failed to download media.');

        const packName = msg.pushName || extra.sender.split('@')[0] || 'Sticker Pack';
        const stickerBuffer = await createStickerBuffer(buffer, { pack: packName, author: 'KYROX-XMD', quality: 70 });

        await sock.sendMessage(chatId, { sticker: stickerBuffer }, { quoted: msg });
        await extra.reply('✅ Sticker created successfully!');
      } catch (mediaError) {
        console.error('Sticker media error:', mediaError && (mediaError.stack || mediaError.message));
        await extra.reply('❌ Failed to convert to sticker. Please try again.');
      }

    } catch (error) {
      console.error('sticker.js error:', error && (error.stack || error.message));
      await extra.reply('❌ An error occurred while processing your request.');
    }
  }
};
