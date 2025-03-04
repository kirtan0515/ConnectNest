import React from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useNavigate } from 'react-router-dom';
import '@aws-amplify/ui-react/styles.css';

const AuthenticatorWrapper = ({ children }) => {
  // Now we can safely call useAuthenticator because
  // we’re wrapped by <Authenticator.Provider> in index.js
  const { user, signOut } = useAuthenticator((context) => [context.user, context.signOut]);
  const navigate = useNavigate();

  // If user is not logged in, redirect to /login
  if (!user) {
    navigate('/login');
    return null; // or a loading spinner
  }

  return (
    <div className="auth-container">
      <header className="auth-header">
        <h2>Welcome, {user.username}!</h2>
        <button onClick={signOut} className="auth-signout-btn">
          Sign Out
        </button>
      </header>
      <div className="auth-content">{children}</div>
    </div>
  );
};

export default AuthenticatorWrapper;
