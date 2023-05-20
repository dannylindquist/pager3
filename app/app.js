import { createServer } from "node:http";
import dotenv from "dotenv";
dotenv.config();

const { app } = await import("./routes.js");
const server = createServer(app.handler);

server.listen(process.env.PORT || 4321, "0.0.0.0");
