import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
import "./index.css";
import { HashProvider } from "./contexts/HashContext";
import "./i18n";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <HashProvider>
        <App />
      </HashProvider>
    </Router>
  </React.StrictMode>
);
