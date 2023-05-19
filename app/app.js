import { createServer } from "node:http";
import { app } from "./routes.js";
import dotenv from "dotenv";
dotenv.config();

const server = createServer(app.handler);

server.listen(process.env.PORT || 4321, "0.0.0.0");
