const chatId = '-1002453163872';
const botApiKey = process.env.TELEGRAM_BOT_TOKEN;
const message = `Hey!`;
const buttonText = 'Play';
const buttonLink = 'https://t.me/ScoutGameXYZBot/start';
const replyMarkup = JSON.stringify({ inline_keyboard: [[{ text: buttonText, url: buttonLink }]] });

const url = `https://api.telegram.org/bot${botApiKey}/sendMessage?chat_id=${chatId}&text=${message}&disable_notification=true&reply_markup=${encodeURIComponent(
  replyMarkup
)}`;

(async () => {
  const res = await fetch(url);
  console.log(res);
})();
