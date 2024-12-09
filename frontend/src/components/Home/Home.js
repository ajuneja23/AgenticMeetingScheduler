import React from "react";
import "./Home.css";

const Home = () => {
  return (
    <div className="app">
      {/* Navigation Bar */}
      <header className="navbar">
        <div className="logo">Aadit's Scheduling Tool</div>
        <nav className="nav-links">
          <a href="#faq">FAQ</a>
          <a href="/scheduler">
            <button className="try-now">TRY NOW</button>
          </a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="firstheader">
          Schedule Meetings <span className="coloredTitle">Seamlessly</span>
        </div>
        <h1 className="headline">A New Way to Meet </h1>
      </main>
    </div>
  );
};

export default Home;
