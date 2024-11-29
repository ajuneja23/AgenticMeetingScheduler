import fs from "fs/promises";
import path from "path";
import process from "process";
import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";

const token_path = path.join(process.cwd(), "./credentials/token.json");
const credential_path = path.join(
  process.cwd(),
  "./credentials/credentials.json"
);

async function saveCredentials(client) {
  try {
    const content = await fs.readFile(credential_path);
    const credentials = JSON.parse(content);

    const keys = credentials.installed;
    console.log(keys);
    const payload = JSON.stringify({
      type: "authorized_user",
      client_id: keys.client_id,
      client_secret: keys.client_secret,
      refresh_token: client.credentials.refresh_token,
    });
    console.log(payload);
    await fs.writeFile(token_path, payload);
  } catch (err) {
    return null;
  }
}

(async () => {
  // Assuming the function saveCredentials is called here
  const client = {}; // Replace with actual client object
  await saveCredentials(client);
})();
