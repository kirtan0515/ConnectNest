import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Amplify } from "aws-amplify";
import awsExports from "./aws-exports";
import "@aws-amplify/ui-react/styles.css";
import "./index.css";
import App from "./App";
import { Authenticator } from "@aws-amplify/ui-react";

// Configure Amplify
Amplify.configure(awsExports);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Authenticator.Provider> {/* ✅ Wrap everything */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Authenticator.Provider>
  </React.StrictMode>
);