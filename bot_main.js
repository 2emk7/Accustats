const mineflayer = require('mineflayer');
const Hypixel = require('hypixel-api-reborn');
const HYPIXEL_API_KEY = 'ENTER API HERE';
const hypixel = new Hypixel.Client(HYPIXEL_API_KEY);
const prefix = ['/gc', '/r'];
const statList = ['fkdr', 'finals', 'wlr', 'finaldeaths', 'wins', 'losses', 'level', 'bblr', 'blr', 'beds', 'bedslost'];
const gamemodeList = ['overall', 'solo', 'solos', 'doubles', 'duos', '2s', 'threes', 'trios', '3s', 'fours', '4s'];

// -------------------- Bot Setup --------------------
const bot = mineflayer.createBot({
    host: 'mc.hypixel.net',
    username: 'ENTER EMAIL HERE',
    auth: 'microsoft',
    version: '1.8.9'
});

//--------------------- recognize messages --------------------
bot.on('message', async (message) => {
    const text = message.toString().trim();
    console.log(`[CHAT] ${text}`);


    const currentPrefix = text.includes('Guild >') ? prefix[0] : prefix[1];
    
    // Check for commands in both guild and private messages
    if (text.includes('?bw') && !(text.split('?bw')[1]?.trim())) {
        getName(text, currentPrefix);
        console.log('Detected ?bw command without arguments');
    }
    if (text.includes('?help')) {
        bothelp(currentPrefix);
    } else if (text.includes('?calc')) {
        calc(text, currentPrefix);
    } else if (text.includes('?bw')) {
        console.log('Detected ?bw command with arguments');
        handleBwCommand(text, currentPrefix, getName(text, currentPrefix));
    } else if (text.includes('You cannot say the same message twice!')) {
        bot.chat(`${currentPrefix} Error: Hypixel doesnt allow repeat outputs`);
    }
});
//--------------------- bot help --------------------
function bothelp(prefix) {
    bot.chat(`${prefix} ?calc <username> <statRatio> <target#>`);
    bot.chat(`${prefix} ?bw <username> [optional stat] [optional gamemode]`);
}
//--------------------- Get Name  --------------------
function getName(text, currentPrefix) {
    console.log('running getName function');
    let name;

    if (text.includes('?bw') && text.split('?bw')[1]?.trim()) { //if theres something after ?bw
        name = text.split('?bw ')[1].split(' ')[0]; // get first argument after ?bw
        console.log(`53 Identified name: ${name}`);

        if (!(statList.includes(name.toLowerCase()) || gamemodeList.includes(name.toLowerCase()))) { // if first argument is not a stat or gamemode
            console.log(`56 Identified username: ${name}`);
            return name;
        } else { // No username provided or first argument is a stat/gamemode
            if (currentPrefix === prefix[0]) { // Guild

                name = text.split('Guild > ')[1].split(":")[0].split(" ");
                console.log(`63 Identified username: ${name}`);
                for (let i = 0; i < name.length; i++) {
                    if (!name[i].includes('[')) {
                        console.log(name[i])
                        return name[i]
                    }
                }

            } else { // Private
                let name = text.split('From ')[1].split(":")[0].split(" ");
                console.log(`73 Identified username: ${name}`);
                for (let i = 0; i < name.length; i++) {
                    if (!name[i].includes('[')) {
                        console.log(name[i])
                        return name[i]
                    }
                }
            }

        }
    }else { // No username provided or first argument is a stat/gamemode
            if (currentPrefix === prefix[0]) { // Guild

                name = text.split('Guild > ')[1].split(":")[0].split(" ");
                console.log(`86 Identified username: ${name}`);
                for (let i = 0; i < name.length; i++) {
                    if (!name[i].includes('[')) {
                        console.log(name[i])
                        return name[i]
                    }
                }

            } else { // Private
                let name = text.split('From ')[1].split(":")[0].split(" ");
                console.log(`96 Identified username: ${name}`);
                for (let i = 0; i < name.length; i++) {
                    if (!name[i].includes('[')) {
                        console.log(name[i])
                        return name[i]
                    }
                }
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
        
        const afterBWtext = text.split('?bw')[1]?.trim() || ''; // part of messaege after ?bw, if nothing after it will be undefined
        const afterbwArray = afterBWtext === '' ? [] : afterBWtext.split(' '); // split into an array, will have general error if afterBWtext is undefined

        console.log(`After splitting '?bw':`, afterBWtext);
        console.log(`Split parts:`, afterbwArray);
        
        if (afterbwArray[0] === username) {
            console.log(`Username '${username}' correctly identified as first argument.`);
        }
        else{
            console.warn(`Warning: Expected username '${username}' as first argument, but got '${afterbwArray[0]}'.`);
        }



        for (let i = 0; i < afterbwArray.length; i++) {
            const part = afterbwArray[i].toLowerCase();

            if (i === 0 && !statList.includes(part) && !gamemodeList.includes(part)) {
                username = part;
                console.log(`Identified username: ${username}`);
            } else if (statList.includes(part) && !stat) {
                stat = part;
                console.log(`Identified stat: ${stat}`);
            } else if (gamemodeList.includes(part) && gamemode === 'overall') {
                gamemode = part;
                console.log(`Identified gamemode: ${gamemode}`);
            }
        }

        console.log(`Parsed - Username: ${username}, Stat: ${stat}, Gamemode: ${gamemode}`);

        let player;
        try {
            player = await hypixel.getPlayer(username);
        } catch (error) {
            bot.chat(`${prefix} Error: Player '${username}' not found.`);
            console.error('Hypixel API Error:', error.message);
            return;
        }
        console.log(stat, gamemode);
        if (!stat && gamemode === 'overall') {
            const level = player.stats.bedwars.level || 0;
            const overallStats = player.stats.bedwars;

            const fkdr = overallStats.finalKDRatio || 0;
            const wlr = overallStats.WLRatio || 0;
            const bblr = overallStats.beds?.BLRatio || 0;
            const finalkills = overallStats.finalKills || 0;
            const wins = overallStats.wins || 0;

            bot.chat(`${prefix} [${level}✫] ${username}'s FKDR-${fkdr}, BBLR-${bblr}, WLR-${wlr}, FINALS-${finalkills}, WINS-${wins}`);
            return;
        }

        let gamemodeStats;
        try {
            gamemodeStats = await get_GamemodeClass(player, gamemode);
        } catch (error) {
            bot.chat(`${prefix} Error: Invalid gamemode '${gamemode}'.`);
            return;
        }

        console.log(gamemodeStats);

        let output;
        try {
            if (stat === 'bblr' || stat === 'blr') {
                output = gamemodeStats.beds?.BLRatio || 0;
            } else if (stat === 'beds') {
                output = gamemodeStats.beds?.broken || 0;
            } else if (stat === 'bedslost') {
                output = gamemodeStats.beds?.lost || 0;
            } else {
                const statKey = await get_statValue(stat);
                output = gamemodeStats[statKey] || 0;
            }

        } catch (error) {
            bot.chat(`${prefix} Error: Could not retrieve stat '${stat}'.`);
            console.error('Stat retrieval error:', error.message);
            return;
        }

        // Send the response
        bot.chat(`${prefix} ${username}'s ${gamemode} ${stat.toUpperCase()}: ${output}`);

    } catch (error) {
        bot.chat(`${prefix} Error: ${error.message}`);
        console.error('General error:', error.message);
    }
}

bot.on('spawn', () => {
    console.log('Bot spawned');
});

bot.on('error', console.error);

bot.on('end', () => {
    console.log('Bot disconnected');
    process.exit();
});