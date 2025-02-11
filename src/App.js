import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import '@aws-amplify/ui-react/styles.css';
import Navbar from './components/layout/Navbar';
import AuthenticatorWrapper from './components/auth/AuthenticatorWrapper';
import Dashboard from './pages/Dashboard/Dashboard';
import Events from './pages/Events/Events';
import Chat from './pages/Chats/Chats';
import Groups from './pages/Groups/Groups';
import Files from './pages/Files/Files';
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login/Login';
import Signup from './pages/Auth/Signup/Signup';
import routes from './routes';
import './App.css';

function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        {/* Public Routes */}
        <Route path={routes.home} element={<Home />} />
        <Route path={routes.login} element={<Login />} />
        <Route path={routes.signup} element={<Signup />} />

        {/* Protected Routes */}
        <Route
          path={routes.dashboard}
          element={
            <AuthenticatorWrapper>
              <Dashboard />
            </AuthenticatorWrapper>
          }
        />
        <Route
          path={routes.events}
          element={
            <AuthenticatorWrapper>
              <Events />
            </AuthenticatorWrapper>
          }
        />
        <Route
          path={routes.chat}
          element={
            <AuthenticatorWrapper>
              <Chat />
            </AuthenticatorWrapper>
          }
        />
        <Route
          path={routes.groups}
          element={
            <AuthenticatorWrapper>
              <Groups />
            </AuthenticatorWrapper>
          }
        />
        <Route
          path={routes.files}
          element={
            <AuthenticatorWrapper>
              <Files />
            </AuthenticatorWrapper>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
