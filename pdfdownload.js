const fs = require("fs/promises");
const request = require("request-promise-native");
const axios = require("axios");
const cheerio = require("cheerio");
const pretty = require("pretty");
const { maxHeaderSize } = require("http");

async function downloadPDF(pdfURL, outputFilename) {
    let pdfBuffer = await request.get({ uri: pdfURL, encoding: null });
    console.log("Writing downloaded PDF file to " + outputFilename + "...");
    return fs.writeFile(outputFilename, pdfBuffer);
}

// downloadPDF("https://www5.tbmm.gov.tr/tutanaklar/TUTANAK/TBMM/d27/c001/tbmm27001001.pdf", "/Users/tarik/PDFSearch/pdfs/tbmm27001001.pdf");


// URL of the page we want to scrape
// const url = "https://www5.tbmm.gov.tr/develop/owa/tutanak_dergisi_pdfler.birlesimler?v_meclis=1&v_donem=d26&v_yasama_yili=1&v_cilt=";

// Async function which scrapes the data
async function scrapeData(url) {
    try {
        // Fetch HTML of the page we want to scrape
        const { data } = await axios.get(url);
        // Load HTML we fetched in the previous line
        const $ = cheerio.load(data);
        // Select all the list items in plainlist class
        const listItems = $('tr:not([bgcolor="#999999"]) > td:first-child > a');
        // Stores data for all countries
        const links = [];
        // Use .each method to loop through the li we selected
        listItems.each((idx, el) => {
            // Object holding data for each country/jurisdiction
            const urlDestructred = $(el).attr("href").split("/");
            urlDestructred[0] = "https:";
            const link = {
                name: $(el).text(),
                url: urlDestructred.join("/")
            };
            //   country.iso3 = $(el).children("span").text();
            // Populate countries array with country data
            links.push(link);
        });

        for (let i = 0; i < Math.ceil(links.length / 5); i++) {
            const linkpackage = links.slice(i * 5, (i + 1) * 5)
            let pdfdownloadpromises = linkpackage.map((element) => downloadPDF(element.url, "./pdfs/" + element.url.split("/")[element.url.split("/").length - 1]).catch(error => console.log(error)))
            await Promise.all(pdfdownloadpromises);
        }
        // Logs countries array to the console
        console.dir(links);

        console.log('Job done!');
        // Write countries array in countries.json file
        fs.writeFile("links.json", JSON.stringify(links, null, 2), (err) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log("Successfully written data to file");
        });
    } catch (err) {
        console.error(err);
    }
}
// // Invoke the above function
// scrapeData("https://www5.tbmm.gov.tr/develop/owa/tutanak_dergisi_pdfler.birlesimler?v_meclis=1&v_donem=d26&v_yasama_yili=1&v_cilt=");


async function yasamalink(url) {
    try {
        // Fetch HTML of the page we want to scrape
        const { data } = await axios.get(url);
        // Load HTML we fetched in the previous line
        const $ = cheerio.load(data);
        // Select all the list items in plainlist class
        const listItems = $('tr:not([bgcolor="#999999"]) > td:first-child > a');
        // Stores data for all countries
        const yasamayillari = [];
        // Use .each method to loop through the li we selected
        listItems.each((idx, el) => {
            let yasamaurl = $(el).attr("href");
            if (!yasamaurl.includes('http')) {
                const masterpageurl = url.split('/')
                masterpageurl[masterpageurl.length - 1] = yasamaurl
                yasamaurl = masterpageurl.join('/')
            }
            const yasamayili = {
                name: $(el).text(),
                url: yasamaurl
            };
            yasamayillari.push(yasamayili);
            console.log(yasamayillari);
        })

        for (let i = 0; i < yasamayillari.length; i++) {
            await scrapeData(yasamayillari[i].url);
        }


    } catch (error) {
        console.error(error)
    } finally {
        console.info('Yasama yılları linki hazır')
    }
};
yasamalink("https://www5.tbmm.gov.tr/develop/owa/tutanak_dergisi_pdfler.yasama_yillari?v_meclis=1&v_donem=27");