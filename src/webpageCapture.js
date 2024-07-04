const puppeteer = require('puppeteer');

class WebpageCapture {
    constructor(options = {}, setState) {
        this.url = options['url'];
        this.capture = null;
        this.stateVal = options['state'];
        this.captureInterval = options['interval'] ?? 2000;
        this.width = (parseInt(options['width'], 10) > 0) ? parseInt(options['width'], 10) : 300;
        this.height = (parseInt(options['height'], 10) > 0) ? parseInt(options['height'], 10) : 600;
        this.deviceScaleFactor = (parseInt(options['deviceScaleFactor'], 10) > 0) ? parseInt(options['deviceScaleFactor'], 10) : 2;
        this.snapshotSelector = options['snapshotSelector'] ?? undefined;
        this.executablePath = '/usr/bin/chromium-browser'; // Adjust path as necessary
        this.setState = setState;
        this.logIt('DEBUG', JSON.stringify(options));
        this.initialize();
    }

    async initialize() {
        let parent = this;
        parent.browser = await puppeteer.launch({
            headless: true,
            executablePath: this.executablePath,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
            defaultViewport: null,
        });
        parent.page = await parent.browser.newPage();
        await parent.page.goto(parent.url, { waitUntil: 'networkidle2' });
        await parent.page.setViewport({ width: parent.width, height: parent.height, deviceScaleFactor: parent.deviceScaleFactor });

        // Inject custom CSS to make the webpage background transparent after page load
        await parent.page.evaluate(() => {
            const style = document.createElement('style');
            style.textContent = `
                body {
                    background-color: transparent !important;
                    border-radius: 20px !important;
                    overflow: hidden !important; /* Clip content to the rounded corners */
                }

                .spotify-component {
                    padding: 0 !important;
                }
            `;
            document.head.appendChild(style);
        });
    }

    pauseCapture() {
        clearInterval(this.capture);
        this.capture = undefined;
    }

    startCapture() {
        let parent = this;
        parent.capture = setInterval(() => {
            parent.takeScreenshot();
        }, parent.captureInterval);
    }

    async stopCapture() {
        clearInterval(this.capture);
        this.capture = null;
    }

    async takeScreenshot() {
        let snapshotPage = this.page;
        if (this.snapshotSelector !== undefined) {
            await this.page.waitForSelector(this.snapshotSelector);
            snapshotPage = await this.page.$(this.snapshotSelector);
        }

        let screenshot = await snapshotPage.screenshot({ 
            encoding: "base64", 
            omitBackground: true
        });
        this.setState(this.stateVal, screenshot);
    }

    logIt() {
        var curTime = new Date().toISOString();
        var message = [...arguments];
        var type = message.shift();
        console.log(curTime, ":" + type + ":", message.join(" "));
    }
}

module.exports = WebpageCapture;
