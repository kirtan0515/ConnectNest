import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './Signup.css';

const Signup = () => {
  return (
    <div className="auth-page">
      <h2>Create a New Account</h2>
      <Authenticator initialState="signUp" signUpAttributes={['email']} />
    </div>
  );
};

export default Signup;
