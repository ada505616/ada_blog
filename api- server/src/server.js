const app = require("./app");
const env = require("./config/env");
const { initializeDatabase } = require("./db/init");

async function bootstrap() {
  await initializeDatabase();

  app.listen(env.port, () => {
    console.log(`API server listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server");
  console.error(error);
  process.exit(1);
});
