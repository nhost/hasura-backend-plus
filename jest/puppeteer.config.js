// jest-puppeteer.config.js
module.exports = {
  launch: {
    headless: true,
    executablePath: 'google-chrome-unstable',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
}
