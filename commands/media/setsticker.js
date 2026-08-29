/**
 * Setsticker Command - Rename sticker pack (rewrite sticker with new pack name)
 */

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { createStickerBuffer } = require('../../utils/sticker');

module.exports = {
  name: 'setsticker',
  aliases: ['renamesticker', 'stickerrename'],
  category: 'media',
  description: 'Rename a sticker pack',
  usage: '.setsticker <new pack name> (reply to sticker)',
  
  async execute(sock, msg, args, extra) {
    try {
      if (args.length === 0) return extra.reply('📝 Usage: .setsticker <new pack name>\n\nReply to a sticker with this command to rename its pack.');
      const newPackName = args.join(' ');

      const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quotedMessage || !quotedMessage.stickerMessage) return extra.reply('⚠️ Please reply to a sticker with .setsticker <new name>');

      const ctx = msg.message.extendedTextMessage?.contextInfo;
      const chatId = extra.from;
      const fakeMsg = { key: { remoteJid: chatId, id: ctx.stanzaId, participant: ctx.participant }, message: quotedMessage };

      try {
        const buffer = await downloadMediaMessage(fakeMsg, 'buffer', {});
        if (!buffer) return extra.reply('❌ Failed to download sticker.');

        const stickerBuffer = await createStickerBuffer(buffer, { pack: newPackName, author: 'KYROX-XMD', quality: 80 });

        await sock.sendMessage(chatId, { sticker: stickerBuffer }, { quoted: msg });
        await extra.reply(`✅ Sticker pack renamed to "${newPackName}"!`);
      } catch (mediaError) {
        console.error('Setsticker media error:', mediaError && (mediaError.stack || mediaError.message));
        await extra.reply('❌ Failed to rename sticker. Please try again.');
      }

    } catch (error) {
      console.error('setsticker.js error:', error && (error.stack || error.message));
      await extra.reply('❌ An error occurred while processing your request.');
    }
  }
};
