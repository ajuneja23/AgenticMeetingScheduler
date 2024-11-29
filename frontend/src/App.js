import logo from "./logo.svg";
import "./App.css";
import {
  useSession,
  useSupabaseClient,
  useSessionContext,
} from "@supabase/auth-helpers-react";
import DateTimePicker from "react-datetime-picker";
import { useState } from "react";

function App() {
  const [pairs, setPairs] = useState([{ phone: "", email: "" }]);
  const [errors, setErrors] = useState([{ phone: "", email: "" }]);

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const validatePhone = (phone) => {
    return String(phone).match(
      /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/
    );
  };

  const handlePairChange = (index, field, value) => {
    const newPairs = [...pairs];
    newPairs[index][field] = value;
    setPairs(newPairs);

    // Validate and set errors
    const newErrors = [...errors];
    if (field === "email") {
      newErrors[index].email = validateEmail(value)
        ? ""
        : "Invalid email format";
    } else if (field === "phone") {
      newErrors[index].phone = validatePhone(value)
        ? ""
        : "Invalid phone format (XXX-XXX-XXXX)";
    }
    setErrors(newErrors);
  };

  const addNewPair = () => {
    if (pairs.length < 5) {
      setPairs([...pairs, { phone: "", email: "" }]);
      setErrors([...errors, { phone: "", email: "" }]);
    }
  };

  const removePair = (index) => {
    const newPairs = pairs.filter((_, i) => i !== index);
    const newErrors = errors.filter((_, i) => i !== index);
    setPairs(newPairs);
    setErrors(newErrors);
  };

  const logPairs = () => {
    console.log("Current pairs:", pairs);
  };

  // Add this JSX inside the return statement after the first div with className="App"
  const inputFields = (
    <div style={{ margin: "20px" }}>
      <h2>Phone & Email Pairs</h2>
      {pairs.map((pair, index) => (
        <div key={index} style={{ margin: "10px 0" }}>
          <input
            type="tel"
            placeholder="Phone (XXX-XXX-XXXX)"
            value={pair.phone}
            onChange={(e) => handlePairChange(index, "phone", e.target.value)}
            style={{ marginRight: "10px" }}
          />
          <input
            type="email"
            placeholder="Email"
            value={pair.email}
            onChange={(e) => handlePairChange(index, "email", e.target.value)}
            style={{ marginRight: "10px" }}
          />
          <button onClick={() => removePair(index)}>Remove</button>
          {errors[index].phone && (
            <div style={{ color: "red" }}>{errors[index].phone}</div>
          )}
          {errors[index].email && (
            <div style={{ color: "red" }}>{errors[index].email}</div>
          )}
        </div>
      ))}
      {pairs.length < 5 && <button onClick={addNewPair}>Add New Pair</button>}
      <button onClick={logPairs} style={{ marginLeft: "10px" }}>
        Log Pairs
      </button>
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
    <div className="App">
      <h1>Calendar access</h1>
      <div>
        {session ? (
          <>
            {" "}
            <h2>Hi {session.user.email}</h2>
            <button onClick={googleSignOut}>Sign out</button>
            {inputFields}
            <button onClick={() => console.log(session.access_token)}>
              Show access token
            </button>
          </>
        ) : (
          <>
            <h1>hi</h1>
            <button onClick={googleSignIn}>Sign in with Google</button>
          </>
        )}
      </div>
      <h1>hi</h1>
    </div>
  );
}

export default App;
