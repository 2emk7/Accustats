const mineflayer = require('mineflayer');
const translate = require("translate-google");
const Hypixel = require('hypixel-api-reborn');
require('dotenv').config();
const fs = require('fs');
const URCHIN_API_KEY = process.env.URCHIN_API_KEY;
const hypixel = new Hypixel.Client(process.env.HYPIXEL_API_KEY);
const sessionfilePath = './session.json';
const statList = ['fkdr', 'finals', 'wlr', 'finaldeaths', 'wins', 'losses', 'level', 'bblr', 'blr', 'beds', 'bedslost'];
const gamemodeList = ['overall', 'solo', 'solos', 'doubles', 'duos', '2s', 'threes', 'trios', '3s', 'fours', '4s'];
const GUILD_PREFIX = "Guild > "
const DM_PREFIX = "From "

// -------------------- Bot Setup --------------------
const bot = mineflayer.createBot({
    host: 'mc.hypixel.net',
    username: process.env.EMAIL,
    auth: 'microsoft',
    version: '1.8.9'
});

//--------------------- Parse messages --------------------
function parseMessage(message) { // will return the message as an array
    return splitmessage = message.split(" ")
}

function getSenderFromStart(message) {
    if (!message.startsWith(GUILD_PREFIX) && !message.startsWith(DM_PREFIX)) {
        return {
            replyprefix: null,
            senderusername: null
        };
    }

    let beforeColon = message.slice(0, message.indexOf(":"));

if (message.startsWith(GUILD_PREFIX)) {
    beforeColon = beforeColon.slice(GUILD_PREFIX.length); // removes "Guild > "
} else {
    beforeColon = beforeColon.slice(DM_PREFIX.length); // removes "From "
}

let senderusername;
const splitmessage = beforeColon.split(" ");
for (let i = 0; i < splitmessage.length; i++) {
    if (!splitmessage[i].includes('[')) {
        senderusername = splitmessage[i];
        break;
    }
}

    if (message.startsWith(GUILD_PREFIX)) {
        return {
            replyprefix: "/gc",
            senderusername: senderusername
        };
    } else if (message.startsWith(DM_PREFIX)) {
        return {
            replyprefix: `/msg ${senderusername}`,  
            senderusername: senderusername
        };
    }
}

//--------------------- recognize messages --------------------
bot.on('message', async (message) => {
    const text = message.toString().trim();
    console.log(`[CHAT] ${text}`);

    let parsed = parseMessage(text) 
    let splitmessage = parsed;
    let {senderusername, replyprefix} = getSenderFromStart(text);   
    if (!senderusername || !replyprefix) {
        return;
    }

    if (text.includes('?calc')) {
        calc(splitmessage, replyprefix);
    } else if (text.includes('?u')) {
        checkUrchin(splitmessage, replyprefix);
    } else if (text.includes('?t')) {
        translatetext(splitmessage, replyprefix);
    } else if (text.includes('?bw')) {
        handleBwCommand(splitmessage, replyprefix, senderusername);
    } else if(text.includes('?session')){
        trackSession(splitmessage, replyprefix, senderusername);
    } else if (text.includes('You cannot say the same message twice!')) {
        bot.chat(`${replyprefix} Error: Hypixel doesnt allow repeat outputs`);
    }
});
//--------------------- Translate  --------------------
async function translatetext(text, prefix) {
    const index = text.indexOf('?t');
    let sentance = text.slice(index + 1);
    if (sentance.length > 1){
        sentance = sentance.join(' ');
    }
    
    if (!sentance) {
        bot.chat(`${prefix} Error: ?t <text>`);
        return;
    }else{
        const result = await translate(sentance, { to: "en" });
        bot.chat(`${prefix} ${result}`);
    }

}

//--------------------- Session Tracker  --------------------
async function trackSession(text, currentPrefix, name) {
    const index = text.indexOf('?session');
    let startorstop = text[index + 1]

    if (!startorstop) {
        bot.chat(`${currentPrefix} Error: ?session <start/stop>`);
        return;
    }else if (startorstop.toLowerCase() === 'start') {
        bot.chat(`${currentPrefix} start tracking ${name}`);
        startSession(name);
        return;
    } else if (startorstop.toLowerCase() === 'stop') {
        await viewSession(currentPrefix, name);
        deleteSession(currentPrefix, name);
        return;
    }else if (startorstop.toLowerCase() === 'view') {
        viewSession(currentPrefix, name);
        return;
    }
}

async function startSession(name) {
    const player = await hypixel.getPlayer(name);
    let sessions = {};

     if (fs.existsSync(sessionfilePath)) {
        try {
            const raw = fs.readFileSync(sessionfilePath, 'utf8');
            sessions = raw ? JSON.parse(raw) : {}; 
        } catch (err) {
            console.error("Error parsing JSON:", err);
            sessions = {}; 
        }
    }

    sessions[name] = {
        start: Date.now(),
        finalKills: player.stats.bedwars.finalKills || 0,
        finalDeaths: player.stats.bedwars.finalDeaths || 0,
        wins: player.stats.bedwars.wins || 0,
        losses: player.stats.bedwars.losses || 0, 
        bedsBroken: player.stats.bedwars.beds?.broken || 0,
        bedsLost: player.stats.bedwars.beds?.lost || 0
    };

    fs.writeFileSync(sessionfilePath, JSON.stringify(sessions, null, 2));
}

async function viewSession(currentPrefix, name) {
    const player = await hypixel.getPlayer(name);
    const bw = player.stats.bedwars;
    const sessions = JSON.parse(fs.readFileSync(sessionfilePath, 'utf8'));

    if (!sessions[name]) {
        bot.chat(`${currentPrefix} No active session for ${name}`);
        return;
    }
    
    const session = sessions[name];
     const diff = {
        finalKills: bw.finalKills - session.finalKills,
        finalDeaths: bw.finalDeaths - session.finalDeaths,
        wins: bw.wins - session.wins,
        losses: bw.losses - session.losses,
        bedsBroken: (bw.beds?.broken || 0) - session.bedsBroken,
        bedsLost: (bw.beds?.lost || 0) - session.bedsLost
    };

    bot.chat(`${currentPrefix} SESSION: FK ${diff.finalKills || 0} | FD ${diff.finalDeaths || 0} | W ${diff.wins || 0} | L ${diff.losses || 0} | BB ${diff.bedsBroken || 0}`);
}

function deleteSession(currentPrefix, name) {
    const sessions = JSON.parse(fs.readFileSync(sessionfilePath, 'utf8'));

    if (sessions[name]) {
        delete sessions[name];
        fs.writeFileSync(sessionfilePath, JSON.stringify(sessions, null, 2));
        bot.chat(`${currentPrefix} Session for ${name} stopped`);
        return;
    } else {
        bot.chat(`${currentPrefix} No active session for ${name}`);
        return;
    }
}
//--------------------- Urchin  --------------------
async function checkUrchin(text, returnPrefix) {
    const index = text.indexOf('?u');
    let username = text[index + 1]

    if (!username) {
        bot.chat(`${returnPrefix} Error: ?u <username>`);
        return;
    }

    const url = `https://urchin.ws/player/${username}?key=${URCHIN_API_KEY}&sources=GAME,CHAT,MANUAL`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.tags || data.tags.length === 0) {
        console.log("No blacklist tags.");
        bot.chat(`${returnPrefix} ${username} is not tagged`);
    } else {
        console.log("BLACKLISTED:");
        for (let i = 0; i < data.tags.length; i++) {
            let tag = data.tags[i];

            console.log(`${tag.type} - ${tag.reason}`);
            bot.chat(`${returnPrefix} ${username}: ${tag.type} - ${tag.reason}`);
        }
    }
}
 
//--------------------- calc function --------------------
async function calc(text, prefix) {
    const index = text.indexOf('?calc');
    let afterCalctext = text.slice(index + 1);
    console.log("248" , afterCalctext);

    const username = afterCalctext[0];
    const statparam = afterCalctext[1];
    const target = parseFloat(afterCalctext[2]);

    try {
        const player = await hypixel.getPlayer(username);
        let answer;

        switch (statparam) {
            case 'fkdr':
                answer = (target * player.stats.bedwars.finalDeaths) - player.stats.bedwars.finalKills;
                break;
            case 'wlr':
                answer = (target * player.stats.bedwars.losses) - player.stats.bedwars.wins;
                break;
            case 'bblr':
            case 'blr':
                answer = (target * player.stats.bedwars.beds.lost) - player.stats.bedwars.beds.broken;
                break;
            default:
                bot.chat(`${prefix} Invalid stat '${statparam}'. Use: fkdr, wlr, bblr`);
                return;
        }

        bot.chat(`${prefix} ${username}'s TARGET ${statparam.toUpperCase()}-> ${target} NEEDED: ${answer} more`);

    } catch (error) {
        bot.chat(`${prefix} Error: ?calc <username> <statRatio> <target#>`);
        console.error('Error:', error.message);
    }
}

//--------------------- get stats and output --------------------
function get_statValue(statValue) {
    switch (statValue) {
        case 'fkdr':
            return 'finalKDRatio';
        case 'wlr':
            return 'WLRatio';
        case 'finals':
            return 'finalKills';
        case 'finaldeaths':
            return 'finalDeaths';
        case 'wins':
            return 'wins';
        case 'losses':
            return 'losses';
        case 'level':
            return 'level';
        case 'bblr':
        case 'blr':
            return 'BLRatio';
        case 'beds':
            return 'broken';
        case 'bedslost':
            return 'lost';
        default:
            throw new Error("INVALID_STAT");
    }
}

function get_GamemodeClass(player, gamemode) {
    const bedwars = player.stats.bedwars;

    switch (gamemode) {
        case 'overall':
            return bedwars;
        case 'solo':
        case 'solos':
            return bedwars.solo || bedwars;
        case 'doubles':
        case 'duos':
        case '2s':
            return bedwars.doubles || bedwars;
        case 'threes':
        case 'trios':
        case '3s':
            return bedwars.threes || bedwars;
        case 'fours':
        case '4s':
            return bedwars.fours || bedwars;
        default:
            throw new Error("INVALID_GAMEMODE");
    }
}

//--------------------- get stats and output --------------------
async function handleBwCommand(splitmessage, prefix, username) {
    try {
        const index = splitmessage.indexOf('?bw');
        let afterBWText = splitmessage.slice(index + 1);

        let stat = null;
        let gamemode = 'overall';
        let gamemodeStats;

        for (let i = 0; i < afterBWText.length; i++) {

            const part = afterBWText[i].toLowerCase();
            if (statList.includes(part) && !stat) {
                stat = part;
                console.log(`253 Identified stat: ${stat}`);
            } else if (gamemodeList.includes(part) && gamemode === 'overall') {
                gamemode = part;
                console.log(`256 Identified gamemode: ${gamemode}`);
            }else if (!gamemodeList.includes(part) && !statList.includes(part)) {
                username = part;
            }
        }

        console.log(`Parsed - Username: ${username}, Stat: ${stat}, Gamemode: ${gamemode}`);

        let player;
        try {
            player = await hypixel.getPlayer(username);
        } catch (error) {
            bot.chat(`${prefix} Error: Player '${username}' not found.`);
            console.error('267 Hypixel API Error:', error.message);
            return;
        }

        try {
            gamemodeStats = await get_GamemodeClass(player, gamemode);
        } catch (error) {
            bot.chat(`${prefix} Error: Invalid gamemode '${gamemode}'.`);
            return;
        }

        if (!stat) { // just ?bw
            const level = gamemodeStats.level || 0;
            const fkdr = gamemodeStats.finalKDRatio || 0;
            const wlr = gamemodeStats.WLRatio || 0;
            const bblr = gamemodeStats.beds?.BLRatio || 0;
            const finalkills = gamemodeStats.finalKills || 0;
            const wins = gamemodeStats.wins || 0;

            bot.chat(`${prefix} [${level}✫] ${username}'s ${gamemode} FKDR-${fkdr}, BBLR-${bblr}, WLR-${wlr}, FINALS-${finalkills}, WINS-${wins}`);
            return;
        }


        let output;
        try {
            if (stat === 'bblr' || stat === 'blr') {
                output = gamemodeStats.beds?.BLRatio || 0;
            } else if (stat === 'beds') {
                output = gamemodeStats.beds?.broken || 0;
            } else if (stat === 'bedslost') {
                output = gamemodeStats.beds?.lost || 0;
            } else {
                const statKey = get_statValue(stat); // if not relating to beds, get the specific stat
                output = gamemodeStats[statKey] || 0;
            }

        } catch (error) {
            bot.chat(`${prefix} Error: Could not retrieve stat '${stat}'.`);
            return;
        }

        bot.chat(`${prefix} ${username}'s ${gamemode} ${stat.toUpperCase()}: ${output}`);  //responds with gamemode and stat

    } catch (error) {
        bot.chat(`${prefix} Error: ${error.message}`);
        console.error('315 General error:', error.message);
    }
}

bot.on('spawn', () => {
    console.log('Bot spawned');
});

bot.on('end', (reason) => {
    console.log(`Bot disconnected: ${reason}`);
    process.exit();
});

bot.on('error', (err) => {
    console.log(`Bot error: ${err}`);
});

bot.on('kicked', (reason) => {
    console.log(`Bot kicked: ${reason}`);
});