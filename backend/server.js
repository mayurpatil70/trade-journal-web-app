// backend/server.js
import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();

// Allow local frontend AND your Vercel frontend URL
const allowedOrigins = [
  "http://localhost:5173",
  "https://forexnotes.vercel.app", // Replace with your actual Vercel domain if different
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(
          new Error("CORS policy violation: This origin is not allowed."),
          false,
        );
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);

app.use(express.json());
