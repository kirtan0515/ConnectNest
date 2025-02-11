import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

const Login = () => {
  return (
    <Authenticator>
      {({ signOut, user }) =>
        user ? (
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h2>Welcome, {user.username}!</h2>
            <button onClick={signOut}>Sign Out</button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h2>Loading authentication...</h2>
          </div>
        )
      }
    </Authenticator>
  );
};

export default Login;
