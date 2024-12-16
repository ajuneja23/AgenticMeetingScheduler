import "./Scheduler.css";
import {
  useSession,
  useSupabaseClient,
  useSessionContext,
} from "@supabase/auth-helpers-react";
import DateTimePicker from "../DateTimePicker/DateTimePicker";
import { useState, useEffect } from "react";
import moment from "moment-timezone";

function Scheduler() {
  const [emails, setEmails] = useState([]);
  const [errors, setErrors] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [timezone, setTimezone] = useState(moment.tz.guess());
  const [duration, setDuration] = useState(null);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const handleEmailChange = (index, value) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const addNewEmail = () => {
    if (!validateEmail(emails[emails.length - 1]) && emails.length > 0) {
      alert("Please enter a valid email address.");
      return;
    }

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
  const session = useSession(); //tokens
  const supabase = useSupabaseClient(); //talk to supabase

  useEffect(() => {
    if (session) {
      setUserEmail(session.user.email);
    }
  }, [session]);
  async function googleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/calendar",
        redirectTo: window.location.origin + "/scheduler",
      },
    });
    console.log(userEmail);
    if (error) {
      alert("Error logging in to Google provider with Supabase");
      console.log(error);
    }
  }

  async function googleSignOut() {
    await supabase.auth.signOut();
  }
  const inputFields = (
    <div style={{ margin: "20px" }}>
      <h2>Meeting Details</h2>
      <div className="locationdescriptiondiv">
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="location-description-input"
        />
      </div>
      <div className="locationdescriptiondiv">
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="location-description-input"
        />
      </div>
      {emails.map((email, index) => (
        <div key={index} style={{ margin: "10px 0" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => handleEmailChange(index, e.target.value)}
            style={{ marginRight: "10px" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                addNewEmail();
              }
            }}
          />
          <button
            onClick={() => removeEmail(index)}
            onKeyDown={(e) => {
              if (e.key === "Delete" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                removeEmail(index);
              }
            }}
          >
            Remove
          </button>
          {errors[index] && <div style={{ color: "red" }}>{errors[index]}</div>}
        </div>
      ))}
      {emails.length < 5 && (
        <button onClick={addNewEmail}>Add New Invitee</button>
      )}

      <div style={{ marginTop: "20px" }}>
        <DateTimePicker
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          timezone={timezone}
          setTimezone={setTimezone}
          duration={duration}
          setDuration={setDuration}
          validateEmail={validateEmail}
          emails={emails}
          organizerEmail={userEmail}
          location={location}
          description={description}
        />
      </div>
    </div>
  );
  return (
    <div className="Scheduler">
      <div>
        {session ? (
          <>
            <div className="welcome" onClick={googleSignOut}>
              <h2>{session.user.email}</h2>
              <span className="sign-out">Sign out?</span>
            </div>
            {inputFields}
          </>
        ) : (
          <>
            <button onClick={googleSignIn}>Sign in with Google</button>
          </>
        )}
      </div>
    </div>
  );
}

export default Scheduler;
/*

2 backend funcs: create the event, and cron job to schedule the event. 
*/
