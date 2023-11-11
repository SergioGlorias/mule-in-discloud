const { Chess } = require("chess.js")
const dayjs = require("dayjs")
const duration = require("dayjs/plugin/duration")
dayjs.extend(duration);

function getPlayerName(player) {
    let name = '';
    if (player.fname) name += player.fname;
    if (player.mname) name += ` ${player.mname}`;
    if (player.lname) name += ` ${player.lname}`;
    return name;
}

async function getLCC(source, gamesParam) {
    const tournamentId = source.tournamentId
    const round = source.round

    const roundInfo = await fetch(
        `https://1.pool.livechesscloud.com/get/${tournamentId}/round-${round}/index.json`
    ).then(res => res.status !== 200 ? null : res.json());

    if (!roundInfo) return ''

    let pgn = ''

    for await (const [index, pairing] of roundInfo.pairings.entries()) {
        let i = index + 1
        if (i > gamesParam) break

        if (!pairing.white || !pairing.black) continue;

        const chess = new Chess();

        chess.header(
            'White', getPlayerName(pairing.white),
            'Black', getPlayerName(pairing.black),
            'Result', pairing.result
        );

        if (pairing.white.title) {
            chess.header('WhiteTitle', pairing.white.title);
        }
        if (pairing.black.title) {
            chess.header('BlackTitle', pairing.black.title);
        }

        let game = await fetch(
            `https://1.pool.livechesscloud.com/get/${tournamentId}/round-${round}/game-${i}.json`
        ).then(res => res.status !== 200 ? null : res.json());

        let lastTime = ""
        if (game) {
            for (const move of game.moves) {
                try {
                    const [sat, timeStringInSecs] = move.split(' ');
                    chess.move(sat);

                    if (timeStringInSecs !== undefined && !timeStringInSecs.startsWith('+')) {
                        const time = dayjs.duration(parseInt(timeStringInSecs), "seconds")
                        lastTime = `[%clk ${time.hours()}:${time.minutes()}:${time.seconds()}]`
                        chess.setComment(lastTime);
                    }
                } catch {
                    chess.setComment("No More Moves: Illegal Move")
                    break
                }
            }
        }

        pgn += chess.pgn() + '\n\n';

    }

    return pgn
}

module.exports = {
    getLCC
}