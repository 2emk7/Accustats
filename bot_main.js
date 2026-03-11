const mineflayer = require('mineflayer');
const translate = require("translate-google");
const Hypixel = require('hypixel-api-reborn');
const fs = require('fs');
const URCHIN_API_KEY = ""; // Enter Urchin API Key
const HYPIXEL_API_KEY = ''; // Enter Hypixel API Key 
const hypixel = new Hypixel.Client(HYPIXEL_API_KEY);
const sessionfilePath = './session.json';
const prefix = ['/gc', '/r'];
const statList = ['fkdr', 'finals', 'wlr', 'finaldeaths', 'wins', 'losses', 'level', 'bblr', 'blr', 'beds', 'bedslost'];
const gamemodeList = ['overall', 'solo', 'solos', 'doubles', 'duos', '2s', 'threes', 'trios', '3s', 'fours', '4s'];
const sessionCommands = ['start', 'stop', 'view'];

// -------------------- Bot Setup --------------------
const bot = mineflayer.createBot({
    host: 'mc.hypixel.net',
    username: '', // Enter Microsoft email
    auth: 'microsoft',
    version: '1.8.9'
});

//--------------------- recognize messages --------------------
bot.on('message', async (message) => {
    const text = message.toString().trim();
    console.log(`[CHAT] ${text}`);


    const currentPrefix = text.includes('Guild >') ? prefix[0] : prefix[1];

    if (text.includes('?calc')) {
        calc(text, currentPrefix);
    } else if (text.includes('?u')) {
        checkUrchin(text, currentPrefix);
    } else if (text.includes('?t')) {
        translatetext(text, currentPrefix);
    } else if (text.includes('?bw')) {
        handleBwCommand(text, currentPrefix, getName(text, currentPrefix, '?bw'));
    } else if(text.includes('?session')){
        trackSession(text, currentPrefix, getName(text, currentPrefix, '?session'));
    } else if (text.includes('You cannot say the same message twice!')) {
        bot.chat(`${currentPrefix} Error: Hypixel doesnt allow repeat outputs`);
    }
});
//--------------------- Translate  --------------------
async function translatetext(text, currentPrefix) {
    const afterTranslatetext = text.split('?t ')[1];
    if (!afterTranslatetext) {
        bot.chat(`${currentPrefix} Error: ?t <text>`);
        return;
    }else{
        const result = await translate(afterTranslatetext, { to: "en" });
        bot.chat(`${currentPrefix} ${result}`);
    }

}
//--------------------- Session Tracker  --------------------
async function trackSession(text, currentPrefix, name) {
    const afterTrackText = text.split('?session ')[1];

    if (!afterTrackText) {
        bot.chat(`${currentPrefix} Error: ?session <start/stop>`);
        return;
    }else if (afterTrackText.toLowerCase() === 'start') {
        bot.chat(`${currentPrefix} start tracking ${name}`);
        startSession(name);
        return;
    } else if (afterTrackText.toLowerCase() === 'stop') {
        await viewSession(currentPrefix, name);
        deleteSession(currentPrefix, name);
        return;
    }else if (afterTrackText.toLowerCase() === 'view') {
        viewSession(currentPrefix, name);
        return;
    }
}

async function startSession(name) {
    const player = await hypixel.getPlayer(name);

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
async function checkUrchin(text, currentPrefix) {

    const afterUrchintext = text.split('?u ')[1];

    if (!afterUrchintext) {
        bot.chat(`${currentPrefix} Error: ?u <username>`);
        return;
    }

    const parts = afterUrchintext.split(' ');
    console.log(parts);
    const username = parts[0];

    const url = `https://urchin.ws/player/${username}?key=${URCHIN_API_KEY}&sources=GAME,CHAT,MANUAL`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.tags || data.tags.length === 0) {
        console.log("No blacklist tags.");
        bot.chat(`${currentPrefix} ${username} is not tagged`);
    } else {
        console.log("BLACKLISTED:");
        for (let i = 0; i < data.tags.length; i++) {
            let tag = data.tags[i];

            console.log(`${tag.type} - ${tag.reason}`);
            bot.chat(`${currentPrefix} ${username}: ${tag.type} - ${tag.reason}`);
        }
    }
}

//--------------------- Get Name  --------------------
function getName(text, currentPrefix, command) {
    console.log('running getName function');
    let name;
    const afterCommand = text.split(command)[1]?.trim(); //get anything after the command

    if (afterCommand) { //if theres something after ?bw
        name = afterCommand.split(' ')[0]; // get first argument after the command


        if (!statList.includes(name.toLowerCase()) && !gamemodeList.includes(name.toLowerCase()) && !sessionCommands.includes(name.toLowerCase())) { // if first argument is not a stat or gamemode, its the username
            console.log(`100 Identified name: ${name}`);
            return name;
        }
    }

    let senderName;

    if (currentPrefix === prefix[0]) { // Guild
        senderName = text.split('Guild > ')[1].split(":")[0].split(" ");
    } else { // Private
        senderName = text.split('From ')[1].split(":")[0].split(" ");
    }

    for (let i = 0; i < senderName.length; i++) {
        if (!senderName[i].includes('[')) {
            console.log(`115 Identified sender username: ${senderName[i]}`);
            return senderName[i];
        }
    }
}
    
//--------------------- calc function --------------------
async function calc(text, prefix) {
    const afterCalctext = text.split('?calc ')[1];

    if (!afterCalctext) {
        bot.chat(`${prefix} Error: ?calc <username> <statRatio> <target#>`);
        return;
    }

    const parts = afterCalctext.split(' '); // ['ableness' , 'fkdr' , '20']
    console.log(parts);
    const username = parts[0];
    console.log(username);
    const statparam = parts[1];
    console.log(statparam);
    const target = parseFloat(parts[2]);
    console.log(target);

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
async function get_statValue(statValue) {
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

async function get_GamemodeClass(player, gamemode) {
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
async function handleBwCommand(text, prefix, username) {
    try {

        let stat = null;
        let gamemode = 'overall';

        let gamemodeStats;
        
        const afterBWtext = text.split('?bw')[1]?.trim() || ''; // part of messaege after ?bw, if nothing after it will be undefined
        const afterbwArray = afterBWtext === '' ? [] : afterBWtext.split(' '); // split into an array, will have general error if afterBWtext is undefined

        console.log(`245 After splitting '?bw':`, afterBWtext);
        console.log(`246 Split parts:`, afterbwArray);


        for (let i = 0; i < afterbwArray.length; i++) {
            const part = afterbwArray[i].toLowerCase();
            if (statList.includes(part) && !stat) {
                stat = part;
                console.log(`253 Identified stat: ${stat}`);
            } else if (gamemodeList.includes(part) && gamemode === 'overall') {
                gamemode = part;
                console.log(`256 Identified gamemode: ${gamemode}`);
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

        if (!stat) {
            const level = gamemodeStats.level || 0;
            const fkdr = gamemodeStats.finalKDRatio || 0;
            const wlr = gamemodeStats.WLRatio || 0;
            const bblr = gamemodeStats.beds?.BLRatio || 0;
            const finalkills = gamemodeStats.finalKills || 0;
            const wins = gamemodeStats.wins || 0;

            bot.chat(`${prefix} [${level}✫] ${username}'s ${gamemode} FKDR-${fkdr}, BBLR-${bblr}, WLR-${wlr}, FINALS-${finalkills}, WINS-${wins}`);
            return;
        }

        console.log(`290 ${gamemodeStats}`);

        let output;
        try {
            if (stat === 'bblr' || stat === 'blr') {
                output = gamemodeStats.beds?.BLRatio || 0;
            } else if (stat === 'beds') {
                output = gamemodeStats.beds?.broken || 0;
            } else if (stat === 'bedslost') {
                output = gamemodeStats.beds?.lost || 0;
            } else {
                const statKey = await get_statValue(stat); // if not relating to beds, get the specific stat
                output = gamemodeStats[statKey] || 0;
            }

        } catch (error) {
            bot.chat(`${prefix} Error: Could not retrieve stat '${stat}'.`);
            console.error('307 Stat retrieval error:', error.message);
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
    console.log(translate);
});

bot.on('error', console.error);

bot.on('end', () => {
    console.log('Bot disconnected');
    process.exit();
});