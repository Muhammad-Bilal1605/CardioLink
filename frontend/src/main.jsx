import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./components/Themes/ThemeProvider.jsx";
import "./global-theme-styles.css";
import { ProfileProvider } from './context/ProfileContext'; 

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
  <ProfileProvider>
    <BrowserRouter>
    
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
    
    </ProfileProvider>
  </React.StrictMode>
);

