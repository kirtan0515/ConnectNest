import React, { useEffect } from "react";
import {
  Authenticator,
  useAuthenticator
} from "@aws-amplify/ui-react";
import { useNavigate } from "react-router-dom";
import "@aws-amplify/ui-react/styles.css";
import logo from "../../../assets/connectnest-logo.png";
import "./Signup.css";

const Signup = () => {
  const { user } = useAuthenticator((context) => [context.user]);
  const navigate = useNavigate();

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="signup-container">
      <div className="signup-left">
        <img src={logo} alt="ConnectNest Logo" className="signup-logo" />
        <h2>Join ConnectNest today</h2>
        <p>Connect, engage, and explore your campus community like never before.</p>
      </div>

      <div className="signup-right">
        <Authenticator
          initialState="signUp"
          signUpAttributes={["name", "email"]}
          formFields={{
            signUp: {
              name: {
                label: "Full Name",
                placeholder: "John Doe",
                isRequired: true,
              },
              email: {
                label: "Email",
                placeholder: "you@campus.edu",
                isRequired: true,
              },
              password: {
                label: "Password",
                placeholder: "Create a secure password",
                isRequired: true,
              },
            },
          }}
          components={{
            SignUp: {
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

export default Signup;
