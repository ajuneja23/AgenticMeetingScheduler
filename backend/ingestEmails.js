import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { google } from "googleapis";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import Groq from "groq-sdk";
import { OAuth2Client } from "google-auth-library";
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

dotenv.config();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
const groq = new Groq({ apiKey: process.env.GROQ_KEY });

const ingestEmail = async (req, res) => {
  try {
    const content = process.env.GOOGLE_AUTH_JSON;
    const credentials = JSON.parse(content);
    const auth = google.auth.fromJSON(credentials);
    const messages = await listMessages(auth);
    const ans = await processSupabase(messages, auth);
    if (ans === "Error Occurred") {
      throw new Error(ans);
    }
    return res.status(200).json({ message: "emails processed" });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

async function listMessages(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  try {
    const tenMinutesAgo = Math.floor((Date.now() - 10 * 60 * 1000) / 1000);
    const res = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["INBOX"],
      q: `is:unread after:${tenMinutesAgo}`,
    });

    const messages = res.data.messages;
    return messages;
  } catch (err) {
    console.error("Error listing messages: ", err);
    throw new Error(err);
  }
}

async function processSupabase(messages, auth) {
  try {
    const gmail = google.gmail({ version: "v1", auth });
    for (const message of messages) {
      const id = message.id;
      const res = await gmail.users.messages.get({
        userId: "me",
        id: id,
        format: "full",
      });
      const headers = res.data.payload.headers;

      const subjectHeader = headers.find((header) => header.name === "Subject");
      if (!subjectHeader) {
        throw new Error("Subject header not found");
      }
      const subject = subjectHeader ? subjectHeader.value : "No subject";
      const fromHeader = headers.find((header) => header.name === "From");
      const sender = fromHeader ? fromHeader.value : "Unknown sender";
      const emailMatch = sender.match(/<(.+)>/);
      const emailAddress = emailMatch ? emailMatch[1] : sender;
      const body = getBody(res);
      const subjForm = "Re: Request for Meeting (ID: ";
      if (subject.startsWith(subjForm) && body.length < 1000) {
        const meetingIdMatch = subject.substring(
          subjForm.length,
          subject.length - 1
        );
        const parseVal = parseInt(meetingIdMatch, 10);
        if (isNaN(parseVal)) {
          continue;
        }
        const { error: err } = await supabase
          .from("invitations")
          .update({
            availability_string: body,
            availability_returned: true,
          })
          .eq("meeting_id", meetingIdMatch)
          .eq("invited_email", emailAddress);
        if (err) {
          throw new Error(err);
        }
        const { data: invitationsData, error: invitationsError } =
          await supabase
            .from("invitations")
            .select("*")
            .eq("meeting_id", meetingIdMatch)
            .eq("availability_returned", false);

        if (invitationsError) {
          console.error("Error fetching invitations:", invitationsError);
          continue; // Skip to the next message if there's an error
        }

        const invitationsCount = invitationsData.length;
        if (invitationsCount == 0) {
          const { data: peopleData, error: peopleErr } = await supabase
            .from("invitations")
            .select("invited_email")
            .eq("meeting_id", meetingIdMatch);
          const { data: eventData, error: eventErr } = await supabase
            .from("meetings")
            .select("*")
            .eq("meeting_id", meetingIdMatch)
            .single();
          const emails = peopleData.map((person) => person.invited_email);
          console.log(eventData);
          const { duration, start_date, end_date, timezone } = eventData;
          console.log(duration);
          console.log(start_date);
          console.log(end_date);
          console.log(timezone);
          await scheduleCalendar(
            meetingIdMatch,
            emails,
            duration,
            start_date,
            end_date,
            timezone
          );
        }
      }
    }
    return "All Processed";
  } catch (err) {
    console.error("Error processing Supabase: ", err);
    throw new Error(err);
  }
}

function getBody(messageRes) {
  let body = "No body available";

  if (messageRes.data.payload.parts) {
    const part = messageRes.data.payload.parts.find(
      (part) => part.mimeType === "text/plain" || part.mimeType === "text/html"
    );

    if (part && part.body.data) {
      // Decode the base64-encoded email body
      const decodedBody = Buffer.from(part.body.data, "base64").toString(
        "utf8"
      );
      body = decodedBody;
    }
  } else if (
    messageRes.data.payload.body &&
    messageRes.data.payload.body.data
  ) {
    // If there's no `parts`, check the main body directly
    const decodedBody = Buffer.from(
      messageRes.data.payload.body.data,
      "base64"
    ).toString("utf8");
    body = decodedBody;
  }
  return extractReplyContent(body, "aadit@aaditjuneja.com");
}

function extractReplyContent(emailBody, knownRecipient) {
  // Regex pattern to match quoted content indicating a reply
  const replyMarkers = [
    new RegExp(`On .*?, .*? <${knownRecipient}> wrote:`), // Matches "On <date>, Aadit <aadit@aaditjuneja.com> wrote:"
    /----- Original Message -----/, // Matches older formats
    /^From: .*/, // Matches "From: <sender>"
  ];

  for (const marker of replyMarkers) {
    const index = emailBody.search(marker);
    if (index !== -1) {
      return emailBody.slice(0, index).trim(); // Extract content above the quote marker
    }
  }

  return emailBody.trim(); // If no markers are found, return the full body
}

async function scheduleCalendar(
  meeting_id,
  invited,
  duration,
  start_date,
  end_date,
  timezone
) {
  try {
    const { data: availabilityData } = await supabase
      .from("invitations")
      .select("availability_string")
      .eq("meeting_id", meeting_id);
    const times = availabilityData.map((invite) => invite.availability_string);
    const systemPrompt = await fs.readFile(
      "./systemPrompts/groqStart.txt",
      "utf8"
    );
    const combinedText = systemPrompt + times;
    /*console.log("bruh");
    console.log(combinedText);
    console.log(timezone);
    console.log(start_date);
    console.log(end_date);
    console.log(duration);*/
    const bestTime = await getGroqChatCompletion(
      combinedText,
      timezone,
      start_date,
      end_date,
      duration
    );
    console.log(bestTime);
    console.log(timezone);
    const auth = createOAuthClient();
    const calendar = google.calendar({ version: "v3", auth });
    const { data: eventData, error: eventError } = await supabase
      .from("meetings")
      .select("*")
      .eq("meeting_id", meeting_id)
      .single();
    const { location, description } = eventData;
    const event = {
      summary: (location || "") + "    " + (description || ""),
      start: {
        dateTime: bestTime,
        timeZone: timezone,
      },
      end: {
        dateTime: new Date(
          new Date(bestTime).getTime() + parseInt(duration, 10) * 60000
        ).toISOString(),
        timeZone: timezone,
      },
      attendees: invited.map((email) => ({ email: email })),
    };
    console.log(event);
    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });
    console.log(response);
    await supabase.from("meetings").delete().eq("meeting_id", meeting_id);

    await supabase.from("invitations").delete().eq("meeting_id", meeting_id);
    return "Success";
  } catch (err) {
    console.error("Error scheduling calendar: ", err);
    throw new Error(err);
  }
}

function createOAuthClient() {
  const googleAuth = JSON.parse(process.env.GOOGLE_AUTH_JSON);
  const oauth2Client = new google.auth.OAuth2(
    googleAuth.client_id,
    googleAuth.client_secret,
    "postmessage"
  );
  oauth2Client.setCredentials({
    refresh_token: googleAuth.refresh_token,
  });
  console.log(oauth2Client);
  return oauth2Client;
}

export async function getGroqChatCompletion(
  text,
  timeZone,
  startDate,
  endDate,
  duration
) {
  try {
    console.log("HEY");
    const finalText = text
      .replace("${timeZone}", timeZone)
      .replace("${startDate}", startDate)
      .replace("${endDate}", endDate)
      .replace("${duration}", duration);
    console.log(finalText);
    const answer = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: finalText,
        },
      ],
      model: "llama3-8b-8192",
    });
    console.log(answer);
    console.log(answer.choices[0]?.message.content);
    return answer.choices[0]?.message.content;
  } catch (err) {
    console.log("gg");
    console.log(err);
    throw new Error(err);
  }
}

export default ingestEmail;
