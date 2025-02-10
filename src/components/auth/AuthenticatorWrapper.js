import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

const AuthenticatorWrapper = ({ children }) => {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div>
          <header className="App-header">
            <h2>Welcome, {user?.username}!</h2>
            <button 
              onClick={signOut} 
              style={{ 
                margin: '20px', 
                fontSize: '0.8rem', 
                padding: '5px 10px', 
                marginTop: '20px'
              }}
            >
              Sign Out
            </button>
          </header>
          {children}
        </div>
      )}
    </Authenticator>
  );
};

export default AuthenticatorWrapper;
