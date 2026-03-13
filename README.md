**Documentation on how to work the bot**

Bot name : **accusant**
Prefix : **?**
Run commands in
Guild Chat: /gc ?command
Direct Message: /msg accusant ?command

**BASIC STATS**

with no specific stat, returns important stats, with a specific stat will return only that stat

Command : ?bw [username] [stat] [gamemode]

Example) ?bw ---> accusant[G3]: [82✫] ableness's FKDR-17.71, BBLR-4.75, WLR-5.29, FINALS-2125, WINS-593 (if the command is initiated by ableness)

Example) ?bw ableness ---> accusant[G3]: [82✫] ableness's FKDR-17.71, BBLR-4.75, WLR-5.29, FINALS-2125, WINS-593

Example) ?bw 4xes fkdr ---> accusant[G3]: 4xes's FKDR: 49.83

Example) ?bw fkdr ---> accusant[G3]: ableness's FKDR: 49.83 (if the command is initiated by ableness)

Example) ?bw tynis fkdr duos —> accusant[G3]: tynis's duos FKDR: 6.45

*Accepted stats*
- fkdr
- finals / finalkills *
- findaldeaths
- kills
- deaths
- bblr / blr *
- beds
- bedslost
- wlr
- wins
- losses
- lvl / level *

*Accepted gamemodes*
- solo / solos *
- doubles / duos / 2s *
- threes / trios / 3s *
- fours / 4s *

*either are accepted


**CALCULATE TARGET STATS**

Calculate how many more of a stat you need to reach a target ratio.

Command : ?calc <username> <stat> <target>

Example) ?calc ableness fkdr 20 ---> accusant[G3]: TARGET FKDR-> 20 NEEDED: 275

*Accepted stats*
- fkdr
- wlr
- blr / bblr *

*either are accepted

**URCHIN**

Lookup a player and see if their urchin tag & description (if they have one)

Command : ?u <username>

Example) ?u aawn -----> accusant [G3]: aawn: closet_cheater - legitscaff, likely autotool & more

**SESSION TRACKER**

Track session stats

Command : ?session <start/stop/view>

start -> starts tracking your stats
stop -> stops tracking your stats
view -> view your session stats

**Translator**

Translates messages into english

Command : ?t <message>

**QUICK REFERENCE**

*BASIC STATS:*
?bw                             # All main stats for the sender
?bw <player>                    # All main stats
?bw <player> <stat>             # Specific stat (overall)
?bw <player> <stat> <mode>      # Stat in specific mode

*CALCULATIONS:*
?calc <player> fkdr <target>    # Final kills needed
?calc <player> wlr <target>     # Wins needed
?calc <player> blr <target>     # Beds needed

*URCHIN*
?u <player>                     # Check urchin tag

