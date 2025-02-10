import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AuthenticatorWrapper from './components/auth/AuthenticatorWrapper';
import Dashboard from './pages/dashboard';
import Events from './pages/events';
import Chat from './pages/chats';
import Groups from './pages/groups';
import Files from './pages/files';
import Home from './pages/home';
import routes from './routes';
import './App.css';

function App() {
  return (
    <Router>
      <AuthenticatorWrapper>
        <Routes>
          <Route path={routes.home} element={<Home />} />
          <Route path={routes.dashboard} element={<Dashboard />} />
          <Route path={routes.events} element={<Events />} />
          <Route path={routes.chat} element={<Chat />} />
          <Route path={routes.groups} element={<Groups />} />
          <Route path={routes.files} element={<Files />} />
        </Routes>
      </AuthenticatorWrapper>
    </Router>
  );
}

export default App;
