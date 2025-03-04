import React, { useEffect } from "react";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import { useNavigate } from "react-router-dom";
import "@aws-amplify/ui-react/styles.css";
import logo from "../../../assets/connectnest-logo.png";
import "./Login.css";

const Login = () => {
  const { user } = useAuthenticator((context) => [context.user]);
  const navigate = useNavigate();

  // If already signed in, go straight to Dashboard
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="login-container">
      <div className="login-left">
        <img src={logo} alt="ConnectNest Logo" className="login-logo" />
        <h2>Make the most of your campus life</h2>
      </div>
      <div className="login-right">
        {/* Authenticator automatically shows the sign-in form if not signed in */}
        <Authenticator
          components={{
            SignIn: {
              style: {
                borderRadius: "8px",
                padding: "20px",
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default Login;
