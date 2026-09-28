import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Global styles are imported inside App.js via ./styles/index.css
// so we don't need a separate import here.

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
