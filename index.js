/*

'use strict';

const fs = require('fs');
const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const config = require('lighthouse/lighthouse-core/config/lr-desktop-config.js');
const reportGenerator = require('lighthouse/lighthouse-core/report/report-generator');



require('dotenv').config();

const PIZZA_PROFILE_URL = 'https://salviospizza.hungerrush.com/Account/Manage';

(async() => {
    let browser = null;
    let page = null;

    try {
        browser = await navigateToPizzaProfile();
        page = (await browser.pages())[0];
        console.log(browser.wsEndpoint());
        console.log('Running lighthouse...');
        const report = await lighthouse(page.url(), {
            port: (new URL(browser.wsEndpoint())).port,
            output: 'json',
            logLevel: 'info',
            disableDeviceEmulation: true,
            chromeFlags: ['--disable-mobile-emulation']
        }, config);
        const json = reportGenerator.generateReport(report.lhr, 'json');
        const html = reportGenerator.generateReport(report.lhr, 'html');
        console.log(`Lighthouse scores: ${report.lhr.score}`);

        console.log('Writing results...');
        fs.writeFileSync('report.json', json);
        fs.writeFileSync('report.html', html);
        console.log('Done!');
    } catch (error) {
        console.error('Error!', error);
    } finally {
        await page.close();
        await browser.close();
    }
})();

async function navigateToPizzaProfile() {
    const browser = await puppeteer.launch({ headless: true });

    console.log('Navigating to Pizza Profile...');
    const page = (await browser.pages())[0];
    await page.goto(PIZZA_PROFILE_URL, { waitUntil: 'networkidle0', timeout: 0 });

    console.log('Starting login, entering username and password...');
    await page.type('#UserName', process.env.USERNAME);
    await page.type('#Password', process.env.PASSWORD);

    console.log('Logging in....');
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click('#btnLogin'),
    ]);

    console.log('Pizza profile unlocked!');
    return browser;
}
*/

const chromeLauncher = require('chrome-launcher');
const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const config = require('lighthouse/lighthouse-core/config/lr-desktop-config.js');
const reportGenerator = require('lighthouse/lighthouse-core/report/report-generator');
const request = require('request');
const util = require('util');
const fs = require('fs');

(async() => {

    const loginURL = 'https://www.coppel.com/LogonForm?catalogId=10001&myAcctMain=1&langId=-5&storeId=12761';
    const userName = process.env.USERNAME;
    const password = process.env.PASSWORD;

    const opts = {
        //chromeFlags: ['--headless'],
        logLevel: 'info',
        output: 'json',
        disableDeviceEmulation: true,
        defaultViewport: {
            width: 1200,
            height: 900
        },
        chromeFlags: ['--disable-mobile-emulation']
    };

// Launch chrome using chrome-launcher
    const chrome = await chromeLauncher.launch(opts);
    opts.port = chrome.port;

// Connect to it using puppeteer.connect().
    const resp = await util.promisify(request)(`http://localhost:${opts.port}/json/version`);
    const {webSocketDebuggerUrl} = JSON.parse(resp.body);
    const browser = await puppeteer.connect({browserWSEndpoint: webSocketDebuggerUrl});


//Puppeteer
    //page = (await browser.pages())[0];
    page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 900});
    await page.goto(loginURL, {waitUntil: 'networkidle2'});
    
    await page.type('[id="WC_AccountDisplay_FormInput_logonId_In_Logon_1"]', userName);
    await page.type('[id="WC_AccountDisplay_FormInput_logonPassword_In_Logon_1"]', password);
    await page.evaluate(() => {
        document.querySelector('[id="Logon"]').submit();
    });
    console.log('after login');
    await page.setDefaultNavigationTimeout(0);
    await page.waitForNavigation();
    

    console.log(page.url());

    await page.goto('https://www.coppel.com/AbonosDetalle?catalogId=10001&langId=-5&storeId=12761&ampabty=mc',{waitUntil: 'networkidle2'});
    
    await page.evaluate( () => {
        document.querySelector('[id="tipo_cantidad_nointeres_1"]').click();
    });

    await page.evaluate( () => {
        document.querySelector('[id="btnRevisarAbono"]').click();
    });
    
    await page.close();

    console.log('before lighthouse');
// Run Lighthouse.
    const report = await lighthouse(page.url(), opts, config).then(results => {
        return results;
    });
    const html = reportGenerator.generateReport(report.lhr, 'html');
    //const json = reportGenerator.generateReport(report.lhr, 'json');

    console.log(`Lighthouse score: ${report.lhr.score}`);
    //await page.goto(logoutURL, {waitUntil: 'networkidle2'});

    await browser.disconnect();
    await chrome.kill();


    //Write report html to the file
    fs.writeFile('your_report.html', html, (err) => {
        if (err) {
            console.error(err);
        }
    });
/*
    //Write report json to the file
    fs.writeFile('report.json', json, (err) => {
        if (err) {
            console.error(err);
        }
    });*/

})();