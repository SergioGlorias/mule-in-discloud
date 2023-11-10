const { Client, GatewayIntentBits } = require("discord.js")
const { discord_token, prefix, hostname } = require("./config.json")

module.exports = async (db) => {
    const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages] });

    client.on('ready', () => {
        console.log(`Logged in as ${client.user.tag}!`);
    });

    client.on("messageCreate", async (msg) => {
        console.log(msg.content)
        if (msg.author.bot) return

        let args = msg.content.split(/\s+/)
        let cmd = args.shift()

        if (cmd === `${prefix}lcc`) {
            if (!args) {
                return msg.reply("You need to provide the source name, tournament ID and round number")
            }
            if (args.length < 2) {
                return msg.reply("You need to provide the tournament ID and round number")
            }
            if (args.length < 3) {
                return msg.reply("You need to provide the round number")
            }

            await db.set(args[0], {
                type: "LCC",
                tournamentId: args[1],
                round: args[2]
            })

            msg.reply(`Source Add: \`${args[0]}\`\n**Link:** ${hostname}/${args[0]}`)

        }

        if (cmd === `${prefix}remove`) {
            if (!args) {
                return msg.reply("You need to provide the source name")
            }

            if (await db.get(args[0])){
                await db.delete(args[0])

                msg.reply(`Source removed`)
            }
        }
    })

    client.login(discord_token)
}