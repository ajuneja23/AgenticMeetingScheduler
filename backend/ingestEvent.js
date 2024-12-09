import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { google } from "googleapis";
import fs from "fs/promises";

dotenv.config();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const setUpEmails = async (req, res) => {
  try {
    const {
      emails,
      userEmail,
      startDate,
      endDate,
      timezone,
      location,
      description,
      duration,
    } = req.body;
    const allEmails = [userEmail, ...emails];
    const createdEvent = await createEvent(
      userEmail,
      location,
      description,
      timezone,
      startDate,
      endDate,
      duration
    );
    if (createdEvent === "Err") {
      return res.status(400).json({ error: "Unable to create event" });
    }
    const meetingID = createdEvent[0].meeting_id;
    console.log(meetingID);
    await handleInvites(
      allEmails,
      startDate,
      endDate,
      meetingID,
      location,
      description,
      timezone
    );
    return res.status(201).json({ message: "Event created successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error " });
  }
};
const createEvent = async (
  userEmail,
  location,
  description,
  timezone,
  start_date,
  end_date,
  duration
) => {
  try {
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .insert([
        {
          creator_email: userEmail,
          location: location,
          description,
          timezone: timezone,
          start_date: start_date,
          end_date: end_date,
          duration: duration,
        },
      ])
      .select("meeting_id")
      .single();
    return [meeting, meetingError];
  } catch (err) {
    console.log(err);
    return "Err";
  }
};
const handleInvites = async (
  emailInvites,
  startDate,
  endDate,
  meeting_id,
  location,
  description,
  timezone
) => {
  try {
    const auth = getGoogleAuth();
    for (const invited_email of emailInvites) {
      await supabase.from("invitations").insert([
        {
          meeting_id: meeting_id,
          invited_email: invited_email,
          availability_returned: false,
          availability_string: "",
        },
      ]);
      const emailBody = await fs
        .readFile("systemPrompts/EmailTemplate.txt", "utf8")
        .then((template) => {
          return template
            .replace("${meetingId}", meeting_id)
            .replace("${recipientName}", invited_email)
            .replace("${startDate}", startDate)
            .replace("${endDate}", endDate)
            .replace("${timeZone}", timezone)
            .replace("${location}", location)
            .replace("${description}", description);
        });
      console.log(emailBody);
      await sendEmail(
        auth,
        `Request for Meeting (ID: ${meeting_id})`,
        emailBody,
        [invited_email]
      );
    }
  } catch (err) {
    console.log(err);
    return err;
  }
};

const getGoogleAuth = () => {
  const content = process.env.GOOGLE_AUTH_JSON;
  const credentials = JSON.parse(content);
  const returnData = google.auth.fromJSON(credentials);
  return returnData;
};
/*
{
      emails: emails,
      userEmail: session.user.email,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      timezone: timezone,
    }
*/

async function sendEmail(auth, subject, body, recipients) {
  try {
    const gmail = google.gmail({ version: "v1", auth });
    console.log(recipients);
    const message = createMessage(recipients, subject, body);
    const { data } = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: message,
      },
    });
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

function createMessage(recipients, subject, body) {
  const message = [
    `To: ${recipients.join(", ")}`,
    `Subject: ${subject}`,
    "Content-Type: text/html; charset=utf-8\n\n",
    "",
    body,
  ].join("\r\n");
  console.log("C");
  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export default setUpEmails;
