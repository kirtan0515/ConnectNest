import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import LoadingSpinner from "./components/layout/LoadingSpinner";
import AuthenticatorWrapper from "./components/auth/AuthenticatorWrapper";
import MainLayout from "./components/layout/MainLayout";
import routes from "./routes";


// Lazy imports of pages/components
const Home = React.lazy(() => import("./pages/Home/Home"));
const Dashboard = React.lazy(() => import("./pages/Dashboard/Dashboard"));
const Events = React.lazy(() => import("./pages/Events/Events"));
const Chat = React.lazy(() => import("./pages/Chats/Chats"));
const Groups = React.lazy(() => import("./pages/Groups/Groups"));
const Files = React.lazy(() => import("./pages/Files/Files"));
const Login = React.lazy(() => import("./pages/Auth/Login/Login"));
const Signup = React.lazy(() => import("./pages/Auth/Signup/Signup"));
const Profile = React.lazy(() => import("./pages/Profile/Profile")); // ✅ Lazy import


function App() {
  return (
    <Authenticator.Provider>
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
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </AuthenticatorWrapper>
            }
          />
          <Route
            path={routes.events}
            element={
              <AuthenticatorWrapper>
                <MainLayout>
                  <Events />
                </MainLayout>
              </AuthenticatorWrapper>
            }
          />
          <Route
            path={routes.chat}
            element={
              <AuthenticatorWrapper>
                <MainLayout>
                  <Chat />
                </MainLayout>
              </AuthenticatorWrapper>
            }
          />
          <Route
            path={routes.groups}
            element={
              <AuthenticatorWrapper>
                <MainLayout>
                  <Groups />
                </MainLayout>
              </AuthenticatorWrapper>
            }
          />
          <Route
            path={routes.files}
            element={
              <AuthenticatorWrapper>
                <MainLayout>
                  <Files />
                </MainLayout>
              </AuthenticatorWrapper>
            }
          />
          <Route
            path={routes.profile}
            element={
              <AuthenticatorWrapper>
                <MainLayout>
                  <Profile />
                </MainLayout>
              </AuthenticatorWrapper>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to={routes.home} />} />
        </Routes>
      </Suspense>
    </Authenticator.Provider>
  );
}

export default App;

