const API_URL = 'http://localhost:3300';

async function consumeAPI(signal) {
  const res = await fetch(API_URL, {
    signal
  });

  let counter = 0;
  const reader = res.body
    .pipeThrough(new TextDecoderStream)
    .pipeThrough(parseNDJSON())
    // .pipeTo(new WritableStream({
    //   write(chunk) {
    //     console.log(++counter, chunk);
    //   }
    // }));
  
  return reader;
}

function appendToHTML(el) {
  return new WritableStream({
      write({name, type, rating, episodes}) {
        const card = `        
          <article>
            <div class="text">
              <h3>${name}</h3>
              <p>Type: ${type}</p>
              <p>Rating: ${rating}</p>
              <p>Episodes: ${episodes}</p>
            </div>
          </article>
        `
        el.innerHTML += card;
      }
  })
}

// caso 2 chunks cheguem em apenas 1 transmissão então conveter corretamente para JSON
function parseNDJSON() {
  let ndjsonBuffer = '';
  return new TransformStream({
    transform(chunk, controller) {
      ndjsonBuffer += chunk;
      
      const items = ndjsonBuffer.split('\n');
      items.slice(0, -1)
        .forEach(i => controller.enqueue(JSON.parse(i)));

      ndjsonBuffer = items[items.length - 1];
    },
    flush(controller) {
      if(!ndjsonBuffer) return;
      controller.enqueue(JSON.parse(ndjsonBuffer));
    }
  })
}

const [
  start,
  stop,
  cards
] = ['start', 'stop', 'cards']
  .map(item => document.getElementById(item));

let abortController = new AbortController();

start.addEventListener('click', async () => {
  const readable = await consumeAPI(abortController.signal);
  readable.pipeTo(appendToHTML(cards));
})

stop.addEventListener('click', () => {
  abortController.abort();
  console.log('aborting...');

  abortController = new AbortController();
})