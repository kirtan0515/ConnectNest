import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './AuthenticatorWrapper.css';

const AuthenticatorWrapper = ({ children }) => {
  const navigate = useNavigate();
  const { user } = useAuthenticator((context) => [context.user]);

  // Redirect to dashboard after successful login
  useEffect(() => {
    if (user) {
      navigate('/dashboard'); // Redirect after successful login
    }
  }, [user, navigate]);

  return (
    <Authenticator>
      {({ signOut, user }) =>
        user ? (
          <div className="auth-container">
            <header className="auth-header">
              <h2>Welcome, {user?.username}!</h2>
              <button onClick={signOut} className="auth-signout-btn">
                Sign Out
              </button>
            </header>
            <div className="auth-content">{children}</div>
          </div>
        ) : (
          <div className="auth-container">
            <h2>Loading authentication...</h2>
          </div>
        )
      }
    </Authenticator>
  );
};

export default AuthenticatorWrapper;
