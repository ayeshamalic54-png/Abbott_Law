import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";

import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

/* ---------------- RAW BODY SUPPORT ---------------- */
declare module "http" {
  interface IncomingMessage {
    rawBody?: Buffer;
  }
}

/* ---------------- CORS (MUST BE FIRST) ---------------- */
app.use(
  cors({
    origin: "http://localhost:5173", // Vite frontend
    credentials: true,               // 🔥 REQUIRED FOR COOKIES
  })
);

/* ---------------- COOKIE + SESSION ---------------- */
app.use(cookieParser());

app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "dev-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,     // ❗ MUST be false on localhost
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

/* ---------------- BODY PARSERS ---------------- */
app.use(
  express.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(
  express.urlencoded({
    extended: false,
    limit: "50mb",
  })
);

/* ---------------- API LOGGER ---------------- */
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    capturedJsonResponse = body;
    return originalJson(body);
  };

  res.on("finish", () => {
    if (!path.startsWith("/api")) return;

    const duration = Date.now() - start;
    let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

    if (capturedJsonResponse) {
      logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
    }

    if (logLine.length > 100) {
      logLine = logLine.slice(0, 99) + "…";
    }

    log(logLine);
  });

  next();
});

/* ---------------- SERVER BOOTSTRAP ---------------- */
(async () => {
  const server = await registerRoutes(app);

  /* ---------------- GLOBAL ERROR HANDLER ---------------- */
  app.use(
    (err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });

      if (app.get("env") === "development") {
        console.error(err);
      }
    }
  );

  /* ---------------- VITE / STATIC ---------------- */
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  /* ---------------- SERVER LISTEN ---------------- */
  const port = Number(process.env.PORT) || 5000;

  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`🚀 Server running on http://localhost:${port}`);
    }
  );
})();
