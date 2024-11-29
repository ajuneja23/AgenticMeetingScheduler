import { google } from "googleapis";
import path from "path";
import { authorize } from "./gmailAuth.js"; // Import your existing auth module
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import getReasoningAgent from "../apiCaller.js";

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

import { createClient } from "@supabase/supabase-js"; // Ensure the import is included
import dotenv from "dotenv"; // Import dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") }); // Load environment variables from .env file

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Function to list unread messages
async function listMessages(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // Calculate the time 10 minutes ago
    const res = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["INBOX"], // Filter to get messages from the Inbox
      q: `is:unread after:${tenMinutesAgo}`, // Only unread emails from the last 10 minutes
    });

    const messages = res.data.messages;
    if (messages) {
      console.log("Unread messages:");
      messages.forEach((message) => {
        console.log(`- Message ID: ${message.id}`);
        getMessage(auth, message.id); // Fetch full message details
      });
    } else {
      console.log("No unread messages found.");
    }
  } catch (err) {
    console.error("Error listing messages: ", err);
  }
}

async function getMessage(auth, messageId) {
  const gmail = google.gmail({ version: "v1", auth });
  try {
    const res = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
    });
    const headers = res.data.payload.headers;
    const subjectHeader = headers.find((header) => header.name === "Subject"); // Find the subject header
    const subject = subjectHeader ? subjectHeader.value : "No subject"; // Get the subject value
    //console.log("Email subject:", subject); // Log the subject

    const fromHeader = headers.find((header) => header.name === "From"); // Find the sender header
    const sender = fromHeader ? fromHeader.value : "Unknown sender"; // Get the sender value
    const emailMatch = sender.match(/<(.+)>/); // Extract email address using regex
    const emailAddress = emailMatch ? emailMatch[1] : sender; // Get the email address or fallback to sender value
    //console.log("Email sender:", emailAddress); // Log the email address

    const message = res.data;
    const body = message.payload.parts
      ? message.payload.parts[0].body.data
      : message.payload.body.data; // Extract body
    const decodedBody = Buffer.from(body, "base64").toString("utf-8"); // Decode from base64
    //console.log("Full message body:", decodedBody); // Log the full body
    return [subject, decodedBody, sender]; // Return subject, body, and sender

    // You can process the email content here
  } catch (err) {
    console.error("Error retrieving message:", err);
  }
}

async function processAndLog(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  try {
    const messages = await listMessages(auth);
    if (messages) {
      console.log("Processing unread messages:");
      for (const message of messages) {
        const [subject, decodedBody, sender] = await getMessage(
          auth,
          message.id
        );
        console.log(`- Message ID: ${message.id}`);
        console.log("Email subject:", subject);
        console.log("Message body:", decodedBody);
        const subjForm =
          "[ACTION REQUIRED] Respond with Availability (Meeting ID: ";
        if (!subject.startsWith(subjForm)) {
          console.log(
            `Skipping message ID: ${message.id} as it does not match the required subject format.`
          );
          continue; // Skip to the next message
        }
        const meetingIdMatch = subject.match(/Meeting ID:\s*(\d+)/); // Match the number after "Meeting ID:"
        if (!meetingIdMatch) {
          console.log(
            `Skipping message ID: ${message.id} as no meeting ID found.`
          );
          continue; // Skip to the next message if no number found
        }
        if (decodedBody.length > 1000) {
          console.log("Skipping message because too long to process");
          continue;
        }
        const { error: err } = await supabase
          .from("invitations")
          .update({
            availability_string: decodedBody,
            availability_returned: true,
          }) // Update both fields
          .eq("meeting_id", meetingIdMatch[1])
          .eq("invited_email", sender);
        const { data: invitationsData, error: invitationsError } =
          await supabase
            .from("invitations")
            .select("*")
            .eq("meeting_id", meetingIdMatch[1])
            .eq("availability_returned", false);

        if (invitationsError) {
          console.error("Error fetching invitations:", invitationsError);
          continue; // Skip to the next message if there's an error
        }

        const invitationsCount = invitationsData.length;
        if (invitationsCount == 0) {
          const { data: invitationsData, error: invitationsError } =
            await supabase
              .from("invitations")
              .select("availability_string")
              .eq("meeting_id", meetingIdMatch[1])
              .eq("availability_returned", true);
          if (invitationsError) {
            continue;
          }
          const availability_strings = invitationsData.map(
            (inv) => inv.availability_string
          );
          findWay(); //TODO
        }
      }
    } else {
      console.log("No unread messages found.");
    }
  } catch (err) {
    console.error("Error processing messages: ", err);
  }
}

const auth = await authorize(); // Get the appropriate auth variable
processAndLog(auth); // Call processAndLog with the auth variable
