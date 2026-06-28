import { createServer } from "node:http";

const port = Number(process.env.BUILD_WORKER_PORT ?? 8790);

createServer((_request, response) => {
  response.writeHead(200, {
    "content-type": "application/json; charset=utf-8"
  });
  response.end(
    JSON.stringify({
      ok: true,
      service: "build-worker",
      mode: "scaffold"
    })
  );
}).listen(port, () => {
  console.log(`Build worker listening on http://localhost:${port}`);
});
