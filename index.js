require('dotenv').config();
const puppeteer = require('puppeteer');
const nodemailer = require("nodemailer");

console.log('The app is up and running...');

const { URL, SELECTOR, CHECKING_IN_SECONDS, RECEIVER_EMAIL, SENDER_EMAIL_SERVICE, SENDER_EMAIL_USER, SENDER_EMAIL_PASSWORD, LAST_PRICE } = process.env;
let lastPrice = Number(LAST_PRICE);

async function start() {
    console.log('START CHECKING!!!')
    // Checks for environment variables
    if (!URL || !SELECTOR || !CHECKING_IN_SECONDS || !RECEIVER_EMAIL || !SENDER_EMAIL_SERVICE || !SENDER_EMAIL_USER || !SENDER_EMAIL_PASSWORD || !LAST_PRICE) {
        clearInterval(checkingPrice);
        return console.log('You must populate the values of the variables in the .env file')
    }

    // Launch headless browser and go to the defined page
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(URL);

    // Extract price from the defined selector (HTML element)
    const info = await page.$eval(SELECTOR, el => el.textContent);
    const currentPrice = Number(info.replace(/[^0-9.-]+/g,""));

    // Send mail if a current price if lower than the defined maximum price
    if (currentPrice !== lastPrice) {
        // async..await is not allowed in global scope, must use a wrapper
        async function main() {
            // Create reusable transporter object using the default SMTP transport
            let transporter = nodemailer.createTransport({
                auth: {
                    user: SENDER_EMAIL_USER,
                    pass: SENDER_EMAIL_PASSWORD
                },
                service: SENDER_EMAIL_SERVICE,
                secure: false,
                debug: false,
                logger: true,
            });

            // Send mail with defined transport object
            let info = await transporter.sendMail({
                from: `"Node Scraper️️" <${SENDER_EMAIL_USER}>`,
                to: RECEIVER_EMAIL,
                subject: 'Price has changed! 📉',
                text: `Current price: ${currentPrice.toLocaleString('sr-RS', { style: 'currency', currency: 'RSD' })}`,
                html: `
                    <div>Current price: 
                        <b>${currentPrice.toLocaleString('sr-RS', { style: 'currency', currency: 'RSD' })}</b>
                    </div>
                    <a href=${URL}>View product</a>
                `,
            });

            console.log("Message sent: %s", info.messageId);
            lastPrice = currentPrice
        }

        main().catch(console.error);
    }

    await browser.close();
}

const checkingPrice = setInterval(start, CHECKING_IN_SECONDS * 1000);