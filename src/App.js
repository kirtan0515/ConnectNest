import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AuthenticatorWrapper from './components/auth/AuthenticatorWrapper';
import Navbar from './components/layout/Navbar';
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

// ✅ Higher-Order Component for Protected Routes (No Navbar)
const ProtectedRoute = ({ children }) => {
  return <AuthenticatorWrapper>{children}</AuthenticatorWrapper>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes (Navbar is included) */}
        <Route path={routes.home} element={<><Navbar /><Home /></>} />
        <Route path={routes.login} element={<><Navbar /><Login /></>} />
        <Route path={routes.signup} element={<><Navbar /><Signup /></>} />

        {/* Protected Routes (No Navbar) */}
        <Route path={routes.dashboard} element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path={routes.events} element={<ProtectedRoute><Events /></ProtectedRoute>} />
        <Route path={routes.chat} element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path={routes.groups} element={<ProtectedRoute><Groups /></ProtectedRoute>} />
        <Route path={routes.files} element={<ProtectedRoute><Files /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
