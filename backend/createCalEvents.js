import dotenv from "dotenv";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

dotenv.config();

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

async function createEvent() {
  const auth = createOAuthClient();
  const calendar = google.calendar({ version: "v3", auth });

  const event = {
    summary: "diddling around", // Hardcoded location and description
    start: {
      dateTime: "2024-12-11T10:00:00Z", // Hardcoded start time
      timeZone: "America/New_York", // Use your preferred timezone
    },
    end: {
      dateTime: new Date(
        new Date("2024-12-11T10:00:00Z").getTime() + 60 * 60000 // 1 hour duration (60 minutes)
      ).toISOString(),
      timeZone: "America/New_York", // Adjust time zone as needed
    },
    attendees: [
      { email: "aadit.juneja12@gmail.com" },
      { email: "aaditj@wharton.upenn.edu" },
    ],
  };
  const response = await calendar.events.insert({
    calendarId: "primary",
    resource: event,
  });
}

(async () => {
  await createEvent();
})();
