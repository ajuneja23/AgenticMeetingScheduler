import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { google } from "googleapis";
// Load .env from parent directory since we're in utils/
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "http://localhost:3000"
);

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const CALENDAR_ID = process.env.CALENDAR_ID;

// TODO: Implement proper OAuth2 flow to get access token
// Current apps should use Google Identity Services library
// See: https://developers.google.com/identity/gsi/web
// Get access token from OAuth2 flow
// For development, can be obtained from Google OAuth 2.0 Playground:
// https://developers.google.com/oauthplayground/
// For production, implement proper OAuth2 flow using Google Identity Services
/**
 * Schedule a meeting on Google Calendar
 * @param {string} summary - Meeting title
 * @param {Date} startTime - Meeting start time
 * @param {Date} endTime - Meeting end time
 * @param {string} description - Meeting description
 * @param {Array<string>} attendees - Array of attendee email addresses
 * @returns {Promise} - Returns created event data
 */
async function scheduleMeeting(
  summary,
  startTime,
  endTime,
  description,
  attendees,
  ACCESS_TOKEN
) {
  try {
    const event = {
      summary,
      description,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      attendees: attendees.map((email) => ({ email })),
      reminders: {
        useDefault: true,
      },
    };

    const response = await axios.post(
      `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events`,
      event,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error scheduling meeting:", error);
    throw error;
  }
}

// Example usage:
/*
scheduleMeeting(
  'Team Meeting',
  new Date('2024-03-20T10:00:00'),
  new Date('2024-03-20T11:00:00'),
  'Weekly team sync meeting',
  ['teammate1@example.com', 'teammate2@example.com']
).then(event => {
  console.log('Meeting scheduled:', event);
}).catch(error => {
  console.error('Failed to schedule meeting:', error);
});
*/

export default scheduleMeeting;
