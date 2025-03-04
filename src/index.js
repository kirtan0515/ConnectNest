import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Amplify } from "aws-amplify";
import awsExports from "./aws-exports";
import "@aws-amplify/ui-react/styles.css";
import "./index.css"; // Your global styles
import App from "./App";
import { Authenticator } from "@aws-amplify/ui-react";

// Configure Amplify once at the root
Amplify.configure(awsExports);

// Import Authenticator


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Provide the Authenticator context for the entire app */}
      <Authenticator.Provider>
        <App />
      </Authenticator.Provider>
    </BrowserRouter>
  </React.StrictMode>
);
