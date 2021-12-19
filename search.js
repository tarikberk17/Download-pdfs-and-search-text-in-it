const fs = require('fs')
const pdf = require('@touno-io/pdf')
var latinize = require('latinize');
const { Parser } = require("json2csv");

let a = [];

const pdfs = './pdfs/';

(async () => {
    const files = (await fs.readdirSync(pdfs)).filter(_ => _.endsWith('.pdf'));
    for (let i = 0; i < files.length; i++) {
        try {
            let file = files[i];
            let dataBuffer = fs.readFileSync("./pdfs/" + file);

            const data = await pdf(dataBuffer);
            let latinText = latinize(data.text);
            let textNoBreak = latinText.replace(/[\r\n|\t]/g, '');

            const wordListBuffer = await fs.readFileSync("./wordlist.txt");
            const wordList = wordListBuffer.toString().split("\n");

            const kelimeler = {
                pdf: file
            };

            wordList.forEach((word) => {
                const regex = new RegExp(word, "gi");
                var count = (textNoBreak.match(regex) || []).length;

                //array im olsun onun içine push edeyim
                kelimeler[word] = count;
                // console.log(kelimeler);
            });



            a.push(kelimeler);
        } catch (error) {
            console.error(error)
            console.log()
        }
    }
    console.log(a);
    // console.log(kelimeler)

    try {
        const fields = Object.keys(a[0]);
        const opts = { fields };
        const parser = new Parser(opts);
        const csv = parser.parse(a);
        fs.writeFile('results.csv', csv, (err) => {
            if (err) throw err;
            console.log('File created');
        })

    } catch (err) {
        console.error(err);
    }
    // console.log(wordList);
})()