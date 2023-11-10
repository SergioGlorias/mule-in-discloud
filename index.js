const fastify = require('fastify')({ logger: true })
const { getLCC } = require("./lcc")
const { QuickDB } = require("quick.db");
const db = new QuickDB();

// Declare a route
fastify.get('/:source', async function handler (request, reply) {
    let gamesParam = request.query.games ?? 128;
    let source = request.params.source
    
    let pgn = ''
    
    if (source) {
        let data = await db.get(source)
        if (data) {
            if (data.type === "LCC") {
                pgn += await getLCC(data, gamesParam)
            }
        }
    }

    reply.send(pgn)
})

// Run the server!
fastify.listen({ port: 8080, host: "0.0.0.0" }, (err) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})

require("./discord")(db)