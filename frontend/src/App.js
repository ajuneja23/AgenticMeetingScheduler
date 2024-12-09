import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./components/Home/Home";
import Scheduler from "./components/Scheduler/Scheduler"; // Assuming Scheduler component is in this path

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scheduler" element={<Scheduler />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
