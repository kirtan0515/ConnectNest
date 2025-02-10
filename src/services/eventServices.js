import { API } from 'aws-amplify';

export const getEvents = async () => {
  return API.get('connectnestAPI', '/events');
};

export const createEvent = async (eventData) => {
  return API.post('connectnestAPI', '/events', { body: eventData });
};
