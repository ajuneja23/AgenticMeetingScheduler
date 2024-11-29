import { google } from "googleapis";
import { authorize } from "./gmailAuth.js";

async function sendEmail(auth, subject, body, recipients) {
  try {
    let auth = await authorize().then().catch(console.error);
    const gmail = google.gmail({ version: "v1", auth });

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

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

(async () => {
  const auth = await authorize(); // Assuming authorize function is available
  const subject = "Test Email Subject";
  const body = "This is a test email body.";
  const recipients = ["aadit.juneja12@gmail.com", "aaditj@wharton.upenn.edu"];

  try {
    const response = await sendEmail(auth, subject, body, recipients);
    console.log("Email sent successfully:", response);
  } catch (error) {
    console.error("Failed to send email:", error);
  }
})();
