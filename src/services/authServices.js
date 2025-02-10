import { Auth } from 'aws-amplify';

export const signIn = async (username, password) => {
  return Auth.signIn(username, password);
};

export const signOut = async () => {
  return Auth.signOut();
};
