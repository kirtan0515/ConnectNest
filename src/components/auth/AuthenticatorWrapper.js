import React from 'react';
import PropTypes from 'prop-types';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './AuthenticatorWrapper.css';

const AuthenticatorWrapper = ({ children }) => {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="auth-container">
          <header className="auth-header">
            <h2>Welcome, {user?.username || 'Guest'}!</h2>
            <button onClick={signOut} className="auth-signout-btn">
              Sign Out
            </button>
          </header>
          <main className="auth-content">{children}</main>
        </div>
      )}
    </Authenticator>
  );
};

// ✅ Prop-Types Validation (Optional but good practice)
AuthenticatorWrapper.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthenticatorWrapper;
