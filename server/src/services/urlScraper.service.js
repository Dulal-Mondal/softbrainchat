// const axios = require('axios');
// const cheerio = require('cheerio');

// const scrapeUrl = async (url) => {
//     const res = await axios.get(url, {
//         timeout: 15000,
//         headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SoftBrainChatBot/1.0)' },
//     });

//     const $ = cheerio.load(res.data);

//     // Noise elements সরাও
//     $('script, style, nav, footer, header, iframe, noscript').remove();
//     $('[class*="cookie"], [class*="popup"], [class*="banner"]').remove();

//     const title = $('title').text().trim();
//     const body = $('body').text()
//         .replace(/\s+/g, ' ')
//         .trim()
//         .substring(0, 50000);

//     if (!body || body.length < 100) {
//         throw new Error('Page has no readable content');
//     }

//     return {
//         title,
//         text: `${title}\n\n${body}`,
//         url,
//     };
// };

// module.exports = { scrapeUrl };



// const axios = require('axios');
// const cheerio = require('cheerio');

// const scrapeUrl = async (url) => {
//     const res = await axios.get(url, {
//         timeout: 20000,
//         maxRedirects: 5,
//         headers: {
//             'User-Agent':
//                 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
//                 '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
//             'Accept':
//                 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
//             'Accept-Language': 'en-US,en;q=0.5,bn;q=0.3',
//         },
//     });

//     const $ = cheerio.load(res.data);

//     // ── Noise elements সরাও ───────────────────────────────────
//     $(
//         'script, style, noscript, iframe, nav, footer, header, ' +
//         '.nav, .footer, .header, .sidebar, .menu, .advertisement, ' +
//         '.cookie, .popup, .modal, .banner, .ad, [role="navigation"], ' +
//         '[role="banner"], [role="contentinfo"]'
//     ).remove();

//     const title = $('title').text().trim() ||
//         $('h1').first().text().trim() ||
//         'Untitled Page';

//     // ── Main content extract করো ──────────────────────────────
//     // Priority: article > main > .content > body
//     let mainEl =
//         $('article').first() ||
//         $('main').first() ||
//         $('[role="main"]').first() ||
//         $('.content').first() ||
//         $('body');

//     // সব text নিয়ে নাও এবং clean করো
//     const rawText = mainEl.text();

//     const cleanText = rawText
//         .replace(/\t/g, ' ')                // tab → space
//         .replace(/[ \t]+/g, ' ')            // multiple spaces → single
//         .replace(/\n{3,}/g, '\n\n')         // 3+ newlines → 2
//         .split('\n')
//         .map(line => line.trim())
//         .filter(line => line.length > 0)    // empty lines বাদ দাও
//         .join('\n')
//         .trim()
//         .substring(0, 80000);               // max 80k chars

//     if (!cleanText || cleanText.length < 100) {
//         throw new Error(`"${url}" থেকে readable content পাওয়া যায়নি`);
//     }

//     // ── Meta description নাও ─────────────────────────────────
//     const description =
//         $('meta[name="description"]').attr('content') ||
//         $('meta[property="og:description"]').attr('content') ||
//         '';

//     // ── Final text: title + description + content ─────────────
//     const fullText = [
//         `Title: ${title}`,
//         description ? `Description: ${description}` : '',
//         '',
//         cleanText,
//     ]
//         .filter(Boolean)
//         .join('\n');

//     return { title, text: fullText, url };
// };

// module.exports = { scrapeUrl };


// const axios = require('axios');
// const cheerio = require('cheerio');
// const puppeteer = require('puppeteer');

// // ── Simple HTTP scrape (static sites) ────────────────────────
// const scrapeStatic = async (url) => {
//     const res = await axios.get(url, {
//         timeout: 15000,
//         headers: {
//             'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
//             'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
//         },
//     });

//     const $ = cheerio.load(res.data);
//     $('script, style, noscript, iframe, nav, footer, header').remove();

//     const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled';
//     const text = $('body').text()
//         .replace(/\s+/g, ' ')
//         .trim()
//         .substring(0, 80000);

//     return { title, text, url };
// };

// // ── Puppeteer scrape (JS-rendered sites) ─────────────────────
// const scrapeDynamic = async (url) => {
//     const browser = await puppeteer.launch({
//         headless: 'new',
//         args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
//     });

//     try {
//         const page = await browser.newPage();
//         await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
//         await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

//         // JS render হওয়ার জন্য একটু অপেক্ষা করো
//         await new Promise(r => setTimeout(r, 2000));

//         const result = await page.evaluate(() => {
//             // Noise সরাও
//             ['script', 'style', 'noscript', 'nav', 'footer', 'header'].forEach(tag => {
//                 document.querySelectorAll(tag).forEach(el => el.remove());
//             });

//             const title = document.title || document.querySelector('h1')?.textContent || 'Untitled';
//             const text = document.body?.innerText || '';
//             return { title, text };
//         });

//         const cleanText = result.text
//             .replace(/\t/g, ' ')
//             .replace(/[ \t]+/g, ' ')
//             .replace(/\n{3,}/g, '\n\n')
//             .split('\n')
//             .map(l => l.trim())
//             .filter(l => l.length > 0)
//             .join('\n')
//             .trim()
//             .substring(0, 80000);

//         return { title: result.title, text: cleanText, url };
//     } finally {
//         await browser.close();
//     }
// };

// // ── Main scraper — static try করো, fail হলে dynamic ─────────
// const scrapeUrl = async (url) => {
//     // আগে static try করো (fast)
//     try {
//         const result = await scrapeStatic(url);
//         if (result.text && result.text.length >= 100) {
//             console.log(`✅ Static scrape: "${url}" → ${result.text.length} chars`);
//             return result;
//         }
//     } catch (err) {
//         console.log(`⚠️  Static scrape failed, trying dynamic: ${err.message}`);
//     }

//     // Static fail হলে Puppeteer দিয়ে try করো
//     console.log(`🔄 Dynamic scrape: "${url}"`);
//     const result = await scrapeDynamic(url);

//     if (!result.text || result.text.length < 100) {
//         throw new Error(`"${url}" থেকে readable content পাওয়া যায়নি`);
//     }

//     return result;
// };

// module.exports = { scrapeUrl };


const axios = require('axios');
const cheerio = require('cheerio');

const scrapeUrl = async (url) => {
    const res = await axios.get(url, {
        timeout: 20000,
        maxRedirects: 5,
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
                '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        },
    });

    const $ = cheerio.load(res.data);

    // Noise সরাও
    $(
        'script, style, noscript, iframe, nav, footer, header, ' +
        '.nav, .footer, .header, .sidebar, .menu, .advertisement, ' +
        '.cookie, .popup, .modal, .banner, .ad, ' +
        '[role="navigation"], [role="banner"], [role="contentinfo"]'
    ).remove();

    const title =
        $('title').text().trim() ||
        $('h1').first().text().trim() ||
        'Untitled Page';

    const description =
        $('meta[name="description"]').attr('content') ||
        $('meta[property="og:description"]').attr('content') ||
        '';

    // Main content priority: article > main > body
    const mainEl =
        $('article').length ? $('article').first() :
            $('main').length ? $('main').first() :
                $('[role="main"]').length ? $('[role="main"]').first() :
                    $('body');

    const cleanText = mainEl.text()
        .replace(/\t/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n')
        .trim()
        .substring(0, 80000);

    if (!cleanText || cleanText.length < 100) {
        throw new Error(`"${url}" থেকে readable content পাওয়া যায়নি`);
    }

    const fullText = [
        `Title: ${title}`,
        description ? `Description: ${description}` : '',
        '',
        cleanText,
    ].filter(Boolean).join('\n');

    return { title, text: fullText, url };
};

module.exports = { scrapeUrl };