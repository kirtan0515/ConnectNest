import React from 'react';
import { Link } from 'react-router-dom';
import routes from '../../routes';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="logo">
        <Link to={routes.home}>ConnectNest</Link>
      </div>
      <ul className="nav-links">
        <li><Link to={routes.home}>Home</Link></li>
        <li><Link to={routes.login}>Login</Link></li>
        <li><Link to={routes.signup}>Sign Up</Link></li>
        <li><Link to={routes.dashboard}>Dashboard</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;
