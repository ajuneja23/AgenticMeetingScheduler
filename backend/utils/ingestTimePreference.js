import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "your_supabase_url"; // Replace with your Supabase URL
const supabaseKey = "your_supabase_key"; // Replace with your Supabase Key
const supabase = createClient(supabaseUrl, supabaseKey);

export async function insertTimePreference(req, res) {
  const { meeting_id, availability_description } = req.body;

  if (!meeting_id || !availability_description) {
    return res
      .status(400)
      .json({ error: "meeting_id and availability_description are required" });
  }

  try {
    const { data, error } = await supabase
      .from("time_preferences") // Replace with your table name
      .insert([{ meeting_id, availability_description }]);

    if (error) {
      throw error;
    }

    return res.status(201).json(data);
  } catch (error) {
    console.error("Error inserting time preference:", error);
    return res.status(500).json({ error: "Failed to insert time preference" });
  }
}

export default insertTimePreference;
/*
schedule event+send emails 

cron job to parse emails + gcal scheduling

*/
