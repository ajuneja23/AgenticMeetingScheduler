import "./Scheduler.css";
import {
  useSession,
  useSupabaseClient,
  useSessionContext,
} from "@supabase/auth-helpers-react";
import DateTimePicker from "../DateTimePicker/DateTimePicker";
import { useState } from "react";
import moment from "moment-timezone";

function Scheduler() {
  const [emails, setEmails] = useState([""]);
  const [errors, setErrors] = useState([""]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [timezone, setTimezone] = useState(moment.tz.guess());

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const handleEmailChange = (index, value) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);

    // Validate and set errors
    const newErrors = [...errors];
    newErrors[index] = validateEmail(value) ? "" : "Invalid email format";
    setErrors(newErrors);
  };

  const addNewEmail = () => {
    if (emails.length < 5) {
      setEmails([...emails, ""]);
      setErrors([...errors, ""]);
    }
  };

  const removeEmail = (index) => {
    const newEmails = emails.filter((_, i) => i !== index);
    const newErrors = errors.filter((_, i) => i !== index);
    setEmails(newEmails);
    setErrors(newErrors);
  };

  const logData = () => {
    console.log({
      emails: emails,
      userEmail: session.user.email,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      timezone: timezone,
    });
    // Check if both dates are selected and end date is after start date
    if (startDate && endDate) {
      if (endDate.isAfter(startDate)) {
        alert("Scheduling Emails Sent.");
      } else {
        alert("Error: End date must be after start date.");
      }
    }
  };

  const inputFields = (
    <div style={{ margin: "20px" }}>
      <h2>Email List</h2>
      {emails.map((email, index) => (
        <div key={index} style={{ margin: "10px 0" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => handleEmailChange(index, e.target.value)}
            style={{ marginRight: "10px" }}
          />
          <button onClick={() => removeEmail(index)}>Remove</button>
          {errors[index] && <div style={{ color: "red" }}>{errors[index]}</div>}
        </div>
      ))}
      {emails.length < 5 && (
        <button onClick={addNewEmail}>Add New Email</button>
      )}
      <button onClick={logData} style={{ marginLeft: "10px" }}>
        Log Emails
      </button>

      <div style={{ marginTop: "20px" }}>
        <h2>Select Time Frame</h2>
        <DateTimePicker
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          timezone={timezone}
          setTimezone={setTimezone}
        />
      </div>
    </div>
  );

  const session = useSession(); //tokens
  const supabase = useSupabaseClient(); //talk to supabase
  console.log(session);
  async function googleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/calendar",
        redirectTo: window.location.origin + "/scheduler",
      },
    });
    if (error) {
      alert("Error logging in to Google provider with Supabase");
      console.log(error);
    }
  }

  async function googleSignOut() {
    await supabase.auth.signOut();
  }
  return (
    <div className="Scheduler">
      <h1>Calendar access</h1>
      <div>
        {session ? (
          <>
            {" "}
            <h2>Hi {session.user.email}</h2>
            <button onClick={googleSignOut}>Sign out</button>
            {inputFields}
          </>
        ) : (
          <>
            <h1>hi</h1>
            <button onClick={googleSignIn}>Sign in with Google</button>
          </>
        )}
      </div>
    </div>
  );
}

export default Scheduler;
/*
todo: 

2 backend funcs: create the event, and cron job to schedule the event. 
*/
