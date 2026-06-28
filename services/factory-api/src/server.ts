import { createFactoryApiServer } from "./index.js";

const port = Number(process.env.FACTORY_API_PORT ?? 8787);
const server = createFactoryApiServer();

server.listen(port, () => {
  console.log(`Factory API listening on http://localhost:${port}`);
});
