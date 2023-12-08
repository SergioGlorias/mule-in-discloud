const cluster = require('node:cluster');
const process = require('node:process');

const fastify = require('fastify')({ logger: true })
const { getLCC } = require("./lcc")
const { QuickDB } = require("quick.db");
const db = new QuickDB();

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < 2; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    cluster.fork();
  });

  require("./discord")(db)
} else {
  fastify.get('/:source', async function handler(request, reply) {
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
  fastify.listen({ port: require("./config.json").port, host: "0.0.0.0" }, (err) => {
    if (err) {
      fastify.log.error(err)
      process.exit(1)
    }
  })
  console.log(`Worker ${process.pid} started`);
}

