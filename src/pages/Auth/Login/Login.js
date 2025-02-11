import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './Login.css';

const Login = () => {
  return (
    <div className="auth-page">
      <h2>Login to ConnectNest</h2>
      <Authenticator signUpAttributes={['email']} />
    </div>
  );
};

export default Login;
