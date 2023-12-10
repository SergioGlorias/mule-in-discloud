const cluster = require('node:cluster');
const process = require('node:process');

const fastify = require('fastify')({ logger: true });
const { getLCC } = require("./lcc");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

const Redis = require("ioredis");

const config = require("./config.json");

(async () => {

  const redis = new Redis(config.redis)

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
            let value = await redis.get(source).then((result) => result)
            if (value) {
              console.log("cache")
              reply.send(value)
              let pgn = await getLCC(data, gamesParam)
              await redis.set(source, pgn, "EX", 60)
            } else {
              console.log("no cache")
              let pgn = await getLCC(data, gamesParam)
              reply.send(pgn)
              await redis.set(source, pgn, "EX", 60)
            }

          }
        }
      }
    })
    fastify.listen({ port: config.port, host: "0.0.0.0" }, (err) => {
      if (err) {
        fastify.log.error(err)
        process.exit(1)
      }
    })
    console.log(`Worker ${process.pid} started`);
  }

})()