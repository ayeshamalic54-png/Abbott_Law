import "dotenv/config";

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import MemoryStore from "memorystore";

import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

/* -------------------- RAW BODY SUPPORT -------------------- */
declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

/* -------------------- BODY PARSING -------------------- */
app.use(
  express.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: false, limit: "50mb" }));

/* -------------------- SESSION SETUP (IMPORTANT FIX) -------------------- */
const Store = MemoryStore(session);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false,
    store: new Store({
      checkPeriod: 86400000,
    }),
    cookie: {
      httpOnly: true,
      secure: false, // local dev
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

/* -------------------- PASSPORT FIX -------------------- */
app.use(passport.initialize());
app.use(passport.session());

/* -------------------- LOGGER -------------------- */
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;

  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;

    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

/* -------------------- MAIN SERVER -------------------- */
(async () => {
  const server = await registerRoutes(app);

  /* ERROR HANDLER */
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
  });

  /* VITE / STATIC */
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);

  /* WINDOWS SAFE LISTEN (FIXED) */
  server.listen(port, () => {
    log(`Server running on http://localhost:${port}`);
  });
})();