import React from "react";
import { useNavigate } from "react-router-dom";
import { NavBarHeader2 } from "../../ui-components"; // Import Amplify UI Navbar
import logo from "../../assets/connectnest-logo.png"; // Import Logo

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <NavBarHeader2
      overrides={{
        "connectnest-logo": {
          src: logo,
          alt: "ConnectNest Logo",
          onClick: () => navigate("/"),
          style: { cursor: "pointer" },
        },
        Home: { onClick: () => navigate("/") },
        About: { onClick: () => navigate("/about") },
        Features: { onClick: () => navigate("/features") },
        Contact: { onClick: () => navigate("/contact") },
        Button39493466: { onClick: () => navigate("/login") }, // Log in button
        Button39493467: { onClick: () => navigate("/signup") }, // Sign up button
      }}
    />
  );
};

export default Navbar;
