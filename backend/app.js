import express from "express";
import cors from "cors"; // Import CORS middleware
import bodyParser from "body-parser"; // Import body-parser middleware
import { sendMeetingEmail } from "./utils/sendgridEmail.js"; // Import the email sending function
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv"; // Import dotenv
import upload from "multer";

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

// Sample route to send an email
app.post("/send-email", async (req, res) => {
  const { invited_emails, message, sender } = req.body; // Adjusted to match the table structure
  try {
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .insert([{ creator_email: sender }])
      .select("meeting_id")
      .single(); // Ensure we get a single meeting entry
    console.log(meeting);
    if (meetingError) {
      throw new Error("Error fetching meeting ID");
    }
    const meetingId = meeting.meeting_id; // Directly access meeting_id from the fetched entry
    for (const invited_email of invited_emails) {
      await supabase.from("invitations").insert([
        {
          meeting_id: meetingId,
          invited_email: invited_email,
          availability_returned: false,
          availability_string: "",
        },
      ]);
      await sendMeetingEmail(invited_email, message, meetingId); // Adjusted to use invited_email
    }

    res.status(200).send("Emails sent successfully");
  } catch (error) {
    res.status(500).send("Error sending email");
  }
});

app.post("/parse-email", async (req, res) => {
  try {
    console.log(req.body);
    const { from, subject, text } = req.body; // Adjusted to match the table structure
    // Get the meeting request ID from email subject
    const meetingId = subject.match(/Request for Meeting \(ID: (\d+)\)/)?.[1];

    // First check if meeting exists
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .select("*")
      .eq("meeting_id", meetingId)
      .single();

    if (meetingError) {
      return res.status(404).send("Meeting request not found");
    }
    const { data: invitations, error: invitationError } = await supabase
      .from("invitations")
      .select("*")
      .eq("meeting_id", meetingId)
      .eq("invited_email", from)
      .single();

    if (invitationError) {
      return res.status(404).send("User not invited to this meeting");
    }
    const { error: err } = await supabase
      .from("invitations")
      .update({ availability_string: text, availability_returned: true }) // Update both fields
      .eq("meeting_id", meetingId)
      .eq("invited_email", from);
    if (err) {
      return res.status(500).send("Error updating availability string");
    }

    // Update the availability_string with the message inputted
    const { data: invitationsData, error: invitationsError } = await supabase
      .from("invitations")
      .select("*")
      .eq("meeting_id", meetingId)
      .eq("availability_returned", false);

    if (invitationsError) {
      return res.status(500).send("Error fetching invitations");
    }

    const invsCount = invitationsData.length;
    if (invsCount == 0) {
      //TODO call a func on gpt
    }

    res.status(200).send("Email response processed successfully");
  } catch (error) {
    console.error("Error processing email response:", error);
    res.status(500).send("Error processing email response");
  }
});

// Start the server
app.listen(PORT, () => {
  x``;
  console.log(`Server is running on port ${PORT}`);
});
