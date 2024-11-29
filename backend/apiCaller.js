import axios from "axios";

async function getReasoningAgent(inputText) {
  try {
    const requestBody = {
      session: { id: "1234567890" },
      messages: [{ role: "user", content: inputText }],
    };

    const response = await axios.post(
      "http://localhost:8003/run-reasoning-agent",
      requestBody
    );

    //const messages = JSON.parse(response.data[6:]);
    const messages = response.data;
    const jsonstring = messages.substring(6, messages.length);
    const messageObj = JSON.parse(jsonstring);

    console.log(messageObj.messages[messageObj.messages.length - 1].content);
  } catch (error) {
    console.error("Error fetching reasoning agent:", error);
  }
}

export default getReasoningAgent;
