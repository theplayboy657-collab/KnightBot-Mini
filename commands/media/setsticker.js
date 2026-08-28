/**
 * Setsticker Command - Rename sticker pack
 */

const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

module.exports = {
  name: 'setsticker',
  aliases: ['renamesticker', 'stickerrename'],
  category: 'media',
  description: 'Rename a sticker pack',
  usage: '.setsticker <new pack name> (reply to sticker)',
  
  async execute(sock, msg, args, extra) {
    try {
      if (args.length === 0) {
        return extra.reply('📝 Usage: .setsticker <new pack name>\n\nReply to a sticker with this command to rename its pack.');
      }

      const newPackName = args.join(' ');

      // Check if message is a reply
      const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      
      if (!quotedMessage || !quotedMessage.stickerMessage) {
        return extra.reply('⚠️ Please reply to a sticker with .setsticker <new name>');
      }

      const ctx = msg.message.extendedTextMessage?.contextInfo;
      const chatId = extra.from;

      // Create fake message for media download
      const fakeMsg = {
        key: {
          remoteJid: chatId,
          id: ctx.stanzaId,
          participant: ctx.participant,
        },
        message: quotedMessage,
      };

      try {
        // Download the sticker
        const buffer = await downloadMediaMessage(fakeMsg, "buffer", {});

        const authorName = 'KnightBot';

        // Recreate sticker with new pack name
        const sticker = new Sticker(buffer, {
          pack: newPackName,
          author: authorName,
          type: StickerTypes.FULL,
          quality: 70,
        });

        const stickerBuffer = await sticker.toBuffer();

        // Send renamed sticker
        await sock.sendMessage(chatId, {
          sticker: stickerBuffer
        }, { quoted: msg });

        await extra.reply(`✅ Sticker pack renamed to "${newPackName}"!`);

      } catch (mediaError) {
        console.error('Setsticker media error:', mediaError);
        await extra.reply('❌ Failed to rename sticker. Please try again.');
      }

    } catch (error) {
      console.error('setsticker.js error:', error);
      await extra.reply('❌ An error occurred while processing your request.');
    }
  }
};
