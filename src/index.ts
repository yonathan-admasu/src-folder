#!/usr/bin/env node

/**
 * Module dependencies.
 */

import app from "./app";
import debug from "debug";
import * as http from "http";

const serverDebug = debug("scrapperexpress:server");

const port = process.env.PORT || 3000;
const httpServer = http.createServer(app);
httpServer.listen(port);
httpServer.on("error", onError);
httpServer.on("listening", onListening);

console.log(`App listening on the port ${port}`);

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== "listen") {
    throw error;
  }
  const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
    case "EADDRINUSE":
      console.error(`${bind} is already in use`);
      process.exit(1);
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening(): void {
  const addr = httpServer.address();
  const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr?.port}`;
  serverDebug(`Listening on ${bind}`);
}
