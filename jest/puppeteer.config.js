// jest-puppeteer.config.js
module.exports = {
  launch: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
}
