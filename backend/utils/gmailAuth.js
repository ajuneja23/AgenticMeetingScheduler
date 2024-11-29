import fs from "fs/promises";
import path from "path";
import process from "process";
import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";
import { fileURLToPath } from "url";
import { dirname } from "path";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
];
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const token_path = path.join(__dirname, "./credentials/token.json");
const credential_path = path.join(__dirname, "./credentials/credentials.json");

async function getCredentials() {
  try {
    console.log(token_path);
    console.log(credential_path);
    const content = await fs.readFile(token_path);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client) {
  try {
    const content = await fs.readFile(credential_path);
    console.log(content);
    const credentials = JSON.parse(content);
    console.log(credentials);
    const keys = credentials["installed"];
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

async function authorize() {
  let client = await getCredentials();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: credential_path,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/*authorize().then((client) => {
  console.log(client.credentials.refresh_token);
});*/

export { getCredentials, saveCredentials, authorize };
