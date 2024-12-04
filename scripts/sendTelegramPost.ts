// Dev chat group
// const chatId = '-1002453163872';
// Official Scout Game group
const chatId = '-1002258724294';

// @scoutgame_announcements_bot
const botApiKey = process.env.TELEGRAM_BOT_TOKEN;

// Format options: https://core.telegram.org/bots/api#formatting-options
const message = `Here’s your new mission: Become a Scout and hunt for the next big onchain builders.\n\nYour role? Spot them early and help them rise to the top. As they climb to success, you rake in rewards for backing the right talent.`;
const buttonText = 'Play';
const buttonLink = 'https://t.me/ScoutGameXYZBot/start';
const replyMarkup = JSON.stringify({ inline_keyboard: [[{ text: buttonText, url: buttonLink }]] });

const url = `https://api.telegram.org/bot${botApiKey}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}&disable_notification=true&reply_markup=${encodeURIComponent(
  replyMarkup
)}`;

(async () => {
  const res = await fetch(url);
  console.log(res);
})();

// To get the chat id for a group: https://api.telegram.org/bot<YourBOTToken>/getUpdates
