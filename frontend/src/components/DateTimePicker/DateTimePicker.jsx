// DateTimePicker.jsx
import React, { useState } from "react";
import Datetime from "react-datetime";
import "react-datetime/css/react-datetime.css";
import "./DateTimePicker.css";
import moment from "moment-timezone";

const DateTimePicker = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  timezone,
  setTimezone,
  emails,
  organizerEmail,
  duration,
  setDuration,
  validateEmail,
  location,
  description,
}) => {
  const handleStartDateChange = (date) => {
    setStartDate(moment(date).tz(timezone));
  };

  const handleEndDateChange = (date) => {
    setEndDate(moment(date).tz(timezone));
  };

  const handleTimezoneChange = (e) => {
    setTimezone(e.target.value);
  };

  const handleDurationChange = (e) => {
    setDuration(e.target.value);
  };

  const handleLogData = async () => {
    try {
      for (let i = 0; i < emails.length; i++) {
        emails[i] = emails[i].toLowerCase();
        if (!validateEmail(emails[i])) {
          alert("Please enter valid email addresses.BRUH");
          return;
        }
        organizerEmail = organizerEmail.toLowerCase();
        if (!validateEmail(organizerEmail)) {
          console.log(organizerEmail);
          alert("Please enter a valid email address.SKIB");
          return;
        }
        if (isNaN(duration)) {
          alert("Please enter a valid duration.");
          return;
        }
        if (!startDate.isValid() || !endDate.isValid()) {
          alert("Please enter valid start and end dates.");
          return;
        }
        if (startDate > endDate) {
          alert("Start date must be before end date.");
          return;
        }
      }
      const body = {
        emails: emails,
        userEmail: organizerEmail,
        startDate: startDate?.format(),
        endDate: endDate?.format(),
        location: location,
        description: description,
        timezone,
        duration,
      };
      console.log(body);
      console.log(process.env.REACT_APP_BACKEND_API);
      const response = await fetch(process.env.REACT_APP_BACKEND_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      alert("Emails sent successfully!");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="datetime-picker-container">
      <h2 className="picker-title">Select Appropriate Meeting Window</h2>

      <div className="timezone-selector">
        <label htmlFor="timezone">Timezone:</label>
        <select
          id="timezone"
          value={timezone}
          onChange={handleTimezoneChange}
          className="timezone-select"
        >
          {moment.tz.names().map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      <div className="datetime-inputs">
        <div className="datetime-input-group">
          <label className="datetime-label"></label>
          <Datetime
            value={startDate}
            onChange={handleStartDateChange}
            inputProps={{
              placeholder: "Select candidate window start",
              className: "datetime-input",
            }}
          />
        </div>

        <div className="datetime-input-group">
          <label className="datetime-label"> </label>
          <Datetime
            value={endDate}
            onChange={handleEndDateChange}
            inputProps={{
              placeholder: "Select candidate window end",
              className: "datetime-input",
            }}
          />
        </div>

        <div className="datetime-input-group">
          <label className="datetime-label"></label>
          <input
            type="number"
            value={duration}
            onChange={handleDurationChange}
            placeholder="Enter duration in minutes"
            className="datetime-input"
          />
        </div>

        <button
          onClick={handleLogData}
          className="log-button"
          style={{
            padding: "10px 20px",
            marginTop: "20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Send Scheduling Emails
        </button>
      </div>

      {startDate && endDate && (
        <div className="selected-date">
          <h3>Selected Range:</h3>
          <div className="date-display">
            <p>
              <strong>Start:</strong>{" "}
              {startDate.format("MMMM Do YYYY, h:mm:ss a z")}
            </p>
            <p>
              <strong>End:</strong>{" "}
              {endDate.format("MMMM Do YYYY, h:mm:ss a z")}
            </p>
            <p>
              <strong>Duration:</strong> {duration} minutes
            </p>
            <p>
              <strong>Timezone:</strong> {timezone}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;
