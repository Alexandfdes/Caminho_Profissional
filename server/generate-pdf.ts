import puppeteer from 'puppeteer';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

app.post('/generate-pdf', async (req, res) => {
    const { html, css } = req.body;

    if (!html) {
        return res.status(400).send('HTML content is required');
    }

    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Set content with injected CSS
        await page.setContent(`
            <!DOCTYPE html>
            <html>
                <head>
                    <style>
                        ${css || ''}
                        @page {
                            margin: 0;
                            size: A4;
                        }
                        body {
                            margin: 0;
                            -webkit-print-color-adjust: exact;
                        }
                    </style>
                    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                </head>
                <body>
                    ${html}
                </body>
            </html>
        `, { waitUntil: 'networkidle0' });

        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '0px',
                right: '0px',
                bottom: '0px',
                left: '0px'
            }
        });

        await browser.close();

        res.contentType('application/pdf');
        res.send(pdf);

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF');
    }
});

app.listen(port, () => {
    console.log(`PDF Generator server running at http://localhost:${port}`);
});
