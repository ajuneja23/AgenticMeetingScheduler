import express from "express";
import cors from "cors"; // Import CORS middleware
import bodyParser from "body-parser"; // Import body-parser middleware
import dotenv from "dotenv"; // Import dotenv
import upload from "multer";
import setUpEmails from "./ingestEvent.js";
import processEmails from "./ingestEmails.js";
import { createClient } from "@supabase/supabase-js";

dotenv.config(); // Load environment variables from .env file
const app = express();
const PORT = process.env.PORT || 3000;

// Start of Selection
app.use(cors()); // Enable CORS
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.post("/handle-event", setUpEmails);
app.post("/process-cron", processEmails);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
