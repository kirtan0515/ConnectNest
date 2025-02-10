import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AuthenticatorWrapper from './components/auth/AuthenticatorWrapper';
import Dashboard from './pages/Dashboard/Dashboard';
import Events from './pages/Events/Events';
import Chat from './pages/Chats/Chats';
import Groups from './pages/Groups/Groups';
import Files from './pages/Files/Files';
import Home from './pages/Home/Home';
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
