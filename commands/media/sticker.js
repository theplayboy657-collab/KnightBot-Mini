/**
 * Sticker Command - Convert image/video to sticker
 */

const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

module.exports = {
  name: 'sticker',
  aliases: ['stick', 'mksticker'],
  category: 'media',
  description: 'Convert image or video to sticker',
  usage: '.sticker (reply to image/video)',
  
  async execute(sock, msg, args, extra) {
    try {
      // Check if message is a reply
      const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      
      if (!quotedMessage) {
        return extra.reply('📷 Please reply to an image or video with .sticker');
      }

      const isImage = !!quotedMessage.imageMessage;
      const isVideo = !!quotedMessage.videoMessage;

      if (!isImage && !isVideo) {
        return extra.reply('❌ This message is neither an image nor a video.');
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
        // Download the media
        const buffer = await downloadMediaMessage(fakeMsg, "buffer", {});

        // Get user's name for pack name
        const packName = msg.pushName || extra.sender.split('@')[0] || 'Sticker Pack';
        const authorName = 'KnightBot';

        // Create sticker
        const sticker = new Sticker(buffer, {
          pack: packName,
          author: authorName,
          type: StickerTypes.FULL,
          quality: 70,
        });

        const stickerBuffer = await sticker.toBuffer();

        // Send sticker
        await sock.sendMessage(chatId, {
          sticker: stickerBuffer
        }, { quoted: msg });

        await extra.reply('✅ Sticker created successfully!');

      } catch (mediaError) {
        console.error('Sticker media error:', mediaError);
        await extra.reply('❌ Failed to convert to sticker. Please try again.');
      }

    } catch (error) {
      console.error('sticker.js error:', error);
      await extra.reply('❌ An error occurred while processing your request.');
    }
  }
};
