/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */
// lib/logger.js

import chalk from 'chalk';
import moment from 'moment-timezone';

const colors = {
  info:    chalk.cyan,
  success: chalk.green,
  warning: chalk.yellow,
  error:   chalk.red,
  command: chalk.magenta,
  message: chalk.blue,
  group:   chalk.greenBright,
  system:  chalk.gray,
  admin:   chalk.yellowBright,
};

const box = {
  top:        '╭',
  bottom:     '╰',
  left:       '│',
  right:      '│',
  middle:     '├',
  horizontal: '─',
};

const formatTime = () => moment().tz('Asia/Jakarta').format('HH:mm:ss');
const formatDate = () => moment().tz('Asia/Jakarta').format('DD/MM/YYYY');

const createBox = (title, content, color = 'info') => {
  const colorFn  = colors[color] || colors.info;
  const maxWidth = 50;
  const padding  = 2;

  const lines     = content.split('\n');
  const maxLength = Math.max(...lines.map((l) => l.length), title.length);
  const boxWidth  = Math.min(Math.max(maxLength + padding * 2, 40), maxWidth);

  let output = '\n';
  output += colorFn(box.top    + box.horizontal.repeat(boxWidth - 2) + box.top)    + '\n';
  output += colorFn(box.left)  + ' ' + chalk.bold(title.padEnd(boxWidth - 3))      + colorFn(box.right) + '\n';
  output += colorFn(box.middle + box.horizontal.repeat(boxWidth - 2) + box.middle) + '\n';

  lines.forEach((line) => {
    output += colorFn(box.left) + ' ' + line.padEnd(boxWidth - 3) + colorFn(box.right) + '\n';
  });

  output += colorFn(box.bottom + box.horizontal.repeat(boxWidth - 2) + box.bottom) + '\n';

  return output;
};

const logger = {
  info: (message) => {
    console.log(colors.info(`[INFO] [${formatTime()}]`) + ` ${message}`);
  },

  success: (message) => {
    console.log(colors.success(`[SUCCESS] [${formatTime()}]`) + ` ${message}`);
  },

  warning: (message) => {
    console.log(colors.warning(`[WARNING] [${formatTime()}]`) + ` ${message}`);
  },

  error: (message, error = null) => {
    console.log(colors.error(`[ERROR] [${formatTime()}]`) + ` ${message}`);
    if (error) console.log(colors.error(`  ${error.message || error}`));
  },

  command: (cmdName, user, userId, chat, isGroup) => {
    const chatName = isGroup ? chat : 'Private Chat';
    const content  = [
      `Command : ${cmdName}`,
      `User    : ${user}`,
      `ID      : ${userId}`,
      `Chat    : ${chatName}`,
      `Time    : ${formatTime()}`,
    ].join('\n');

    console.log(createBox('COMMAND EXECUTED', content, 'command'));
  },

  message: (from, sender, type, body, isGroup) => {
    const chatType      = isGroup ? 'GROUP' : 'PRIVATE';
    const messagePreview = body.length > 40 ? body.substring(0, 40) + '...' : body;

    const content = [
      `Type    : ${chatType}`,
      `From    : ${sender}`,
      `Chat    : ${from}`,
      `Msg Type: ${type}`,
      `Content : ${messagePreview}`,
      `Time    : ${formatTime()}`,
    ].join('\n');

    console.log(createBox('NEW MESSAGE', content, 'message'));
  },

  group: (action, groupName, participants) => {
    const content = [
      `Action  : ${action}`,
      `Group   : ${groupName}`,
      `Members : ${participants}`,
      `Time    : ${formatTime()}`,
    ].join('\n');

    console.log(createBox('GROUP UPDATE', content, 'group'));
  },

  system: (message) => {
    console.log(colors.system(`[SYSTEM] [${formatTime()}]`) + ` ${message}`);
  },

  connection: (status, reason = '') => {
    const content = [
      `Status  : ${status}`,
      reason ? `Reason  : ${reason}` : '',
      `Time    : ${formatTime()}`,
    ].filter(Boolean).join('\n');

    const color = status === 'open' ? 'success' : status === 'close' ? 'error' : 'warning';
    console.log(createBox('CONNECTION', content, color));
  },

  startup: (botName, version, waVersion) => {
    const banner = `
╔═══════════════════════════════════════╗
║                                       ║
║        ${botName.padEnd(28)}   ║
║        Version : ${version.padEnd(20)}   ║
║        WA      : ${waVersion.padEnd(20)}   ║
║        Date    : ${formatDate().padEnd(20)}   ║
║        Time    : ${formatTime().padEnd(20)}   ║
║                                       ║
╚═══════════════════════════════════════╝
    `;
    console.log(colors.success(banner));
  },

  divider: () => {
    console.log(colors.system('─'.repeat(50)));
  },

  clear: () => {
    console.clear();
  },
};

export default logger;
