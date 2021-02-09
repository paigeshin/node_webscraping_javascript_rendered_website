const puppeteer = require('puppeteer')
const cheerio = require('cheerio')

const sample = {
    guests: 1,
    bedrooms: 1,
    beds: 1,
    baths: 1
}

let browser;

// https://www.airbnb.com/s/Seoul/homes?refinement_paths%5B%5D=%2Fhomes&search_type=pagination&tab_id=home_tab&date_picker_type=calendar&place_id=ChIJzWXFYYuifDUR64Pq5LTtioU&federated_search_session_id=0ad4672f-a05a-456f-958c-9f03c67e0335&map_toggle=false&items_offset=20&section_offset=4

async function scrapeHomesInIndexPage(url) {
    try {
        const page = await browser.newPage()
        await page.goto(url, { waitUntil: "networkidle2" })

        //evaluate(), excute javascript inside of a brwoser 
        const html = await page.evaluate(() => document.body.innerHTML)
        const $ = await cheerio.load(html)

        const homes = $("[itemprop='url']")
            .map((index, element) => "https://" + $(element).attr('content').replace('undefined', 'www.airbnb.com') )
            .get()

        return homes
    } catch (error) {
        console.error(error)
    }
}

async function scrapeDescriptionPage(url, page) {
    try {
        //consider navigation to be finished when there are no more than 2 network connections for at least 500ms
        await page.goto(url, { waitUntil: "networkidle2" })
        const html = await page.evaluate(() => document.body.innerHTML)
        const $ = cheerio.load(html)
        const roomText = $('#room').text()
        const guestsAllowed = returnMatches(roomText, /\d+ guest/)
        const bathes = returnMatches(roomText, /\d+ (shared )?bath/)
        const beds = returnMatches(roomText, /\d+ bed/)
        return { url, guestsAllowed, bedrooms, bathes, beds }
    } catch(error) {
        console.errorurl
        console.error(error)
    }
}

//using regular expression...
//정규식을 쓰는 구조가 더 좋을 수가 있다. 웹사이트 구조가 바뀌면 원하는 정보를 가져오기 힘들어질 수 있기 때문이다.
function returnMatches(roomText, regex) {
    const regExMatches = roomText.match(regex)
    let result = 'N/A'
    if(regExMatches != null) {
        result = regExMatches[0]
    } else {
        throw `No regex matches found for: ${regex}`
    }
    return result 
}

async function main() {
    browser = await puppeteer.launch({ headless: false })
    const descriptionPage = await browser.newPage()
    const homes = await scrapeHomesInIndexPage('https://www.airbnb.com/s/Seoul/homes?refinement_paths%5B%5D=%2Fhomes&search_type=pagination&tab_id=home_tab&date_picker_type=calendar&place_id=ChIJzWXFYYuifDUR64Pq5LTtioU&federated_search_session_id=0ad4672f-a05a-456f-958c-9f03c67e0335&map_toggle=false&items_offset=20&section_offset=4')
    console.log(homes)
    for(let i = 0; i < homes.length; i++) {
        await scrapeDescriptionPage(homes[i], descriptionPage)    
    }    

}

main()