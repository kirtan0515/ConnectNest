import React, { Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import "@aws-amplify/ui-react/styles.css";
import routes from "./routes";
import "./App.css";
import LoadingSpinner from "./components/layout/LoadingSpinner";
import AuthenticatorWrapper from "./components/auth/AuthenticatorWrapper";

// Lazy-loaded pages
const Home = React.lazy(() => import("./pages/Home/Home"));
const Dashboard = React.lazy(() => import("./pages/Dashboard/Dashboard"));
const Events = React.lazy(() => import("./pages/Events/Events"));
const Chat = React.lazy(() => import("./pages/Chats/Chats"));
const Groups = React.lazy(() => import("./pages/Groups/Groups"));
const Files = React.lazy(() => import("./pages/Files/Files"));
const Login = React.lazy(() => import("./pages/Auth/Login/Login"));
const Signup = React.lazy(() => import("./pages/Auth/Signup/Signup"));



function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
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

        {/* Fallback: Redirect unknown routes to home */}
        <Route path="*" element={<Navigate to={routes.home} />} />
      </Routes>
    </Suspense>
  );
}

export default App;
