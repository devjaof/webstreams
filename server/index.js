import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { Readable, Transform } from 'node:stream';
import { WritableStream, TransformStream } from 'node:stream/web';
import { setTimeout } from 'node:timers/promises';
import csvtojson from 'csvtojson';

const PORT = 3300
// curl -i -X OPTIONS -N localhost:3300
// curl -N localhost:3300
createServer(async (req, res) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers)
    res.end()
    return;
  }

  res.once('close', _=> console.log(`connection closed, ${items} items loaded...`))

  let items = 0;
  Readable.toWeb(createReadStream('./animeflv.csv'))
  // passo a passo de cada item
  .pipeThrough(Transform.toWeb(csvtojson()))
  .pipeThrough(new TransformStream({
    transform(chunk, controller) {
      const data = JSON.parse(Buffer.from(chunk))
      controller.enqueue(
        JSON.stringify({
          title: data.title,
          description: data.description,
          url_anime: data.url_anime,
        }).concat('\n')
      );
    }
  }))
  // pipeTo é a ultima etapa
  .pipeTo(new WritableStream({
    async write(chunk) {
      await setTimeout(500);
      items++;
      res.write(chunk);
    },
    close() {
      res.end();
    }
  }))

  res.writeHead(200, headers);
  // res.end('ok');
})
.listen(PORT)
.on('listening', _ => console.log(`server is running at ${PORT}`));