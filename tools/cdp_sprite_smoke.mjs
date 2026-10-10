import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const delay = ms => new Promise(done => setTimeout(done, ms));
const pages = await (await fetch("http://127.0.0.1:9222/json")).json();
const page = pages.find(item => item.type === "page" && item.url.startsWith("http://127.0.0.1:8765/"));
if (!page) throw new Error("Clash of Mon debug page not found");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolveOpen, reject) => {
  socket.addEventListener("open", resolveOpen, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 1;
const pending = new Map();
const errors = [];
socket.addEventListener("message", event => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve: ok, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else ok(message.result);
  }
  if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.text);
});

function send(method, params = {}) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolveSend, reject) => pending.set(id, { resolve: resolveSend, reject }));
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

await send("Runtime.enable");
await send("Page.enable");
await evaluate("document.fonts.ready");
await evaluate("SEL.nick='Sprite Test'; SEL.ar='random'; true");

const output = resolve("test-output");
await mkdir(output, { recursive: true });

for (const name of ["aurex", "chronox", "verdara"]) {
  await evaluate(`SEL.mon='${name}'; startBot(); G.cd=0; true`);
  await delay(450);
  await evaluate("record(G.me,G.me.mon.basic,{ax:1,ay:0,mag:1}); true");
  await delay(80);
  const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(resolve(output, `${name}-runtime.png`), Buffer.from(shot.data, "base64"));
}

const loaded = await evaluate("[...HERO_SPRITES].every(k=>SCN.textures.exists('hero_'+k))");
socket.close();
if (!loaded) throw new Error("One or more character sprite sheets failed to load");
if (errors.length) throw new Error(`Runtime exceptions: ${errors.join('; ')}`);
console.log("Sprite runtime smoke test passed for aurex, chronox, verdara");
