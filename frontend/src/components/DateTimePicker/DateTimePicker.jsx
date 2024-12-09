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

  const handleLogData = () => {
    console.log({
      timezone,
      startDate: startDate?.format("MMMM Do YYYY, h:mm:ss a z"),
      endDate: endDate?.format("MMMM Do YYYY, h:mm:ss a z"),
    });
  };

  return (
    <div className="datetime-picker-container">
      <h2 className="picker-title">Select Date & Time Range</h2>

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
          <label className="datetime-label">Start Date & Time:</label>
          <Datetime
            value={startDate}
            onChange={handleStartDateChange}
            inputProps={{
              placeholder: "Select start date and time",
              className: "datetime-input",
            }}
          />
        </div>

        <div className="datetime-input-group">
          <label className="datetime-label">End Date & Time:</label>
          <Datetime
            value={endDate}
            onChange={handleEndDateChange}
            inputProps={{
              placeholder: "Select end date and time",
              className: "datetime-input",
            }}
          />
        </div>

        <div className="datetime-input-group">
          <label className="datetime-label">Email:</label>
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
          Log Data
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
              <strong>Timezone:</strong> {timezone}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;
