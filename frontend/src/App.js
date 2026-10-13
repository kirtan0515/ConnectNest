import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoadingSpinner from "./components/layout/LoadingSpinner";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import routes from "./routes";

// Lazy imports of pages/components
const Home = React.lazy(() => import("./pages/Home/Home"));
const Dashboard = React.lazy(() => import("./pages/Dashboard/Dashboard"));
const Events = React.lazy(() => import("./pages/Events/Events"));
const EventDetail = React.lazy(() => import("./pages/Events/EventDetail"));
const Chat = React.lazy(() => import("./pages/Chats/Chats"));
const Groups = React.lazy(() => import("./pages/Groups/Groups"));
const Files = React.lazy(() => import("./pages/Files/Files"));
const Login = React.lazy(() => import("./pages/Auth/Login/Login"));
const Signup = React.lazy(() => import("./pages/Auth/Signup/Signup"));
const ForgotPassword = React.lazy(() => import("./pages/Auth/ForgotPassword/ForgotPassword"));
const AuthCallback = React.lazy(() => import("./pages/Auth/Callback/AuthCallback"));
const Onboarding = React.lazy(() => import("./pages/Auth/Onboarding/Onboarding"));
const About = React.lazy(() => import("./pages/About/About"));
const Profile = React.lazy(() => import("./pages/Profile/Profile"));
const Settings = React.lazy(() => import("./pages/Settings/Settings"));

const protectedPage = (Page) => (
  <ProtectedRoute>
    <MainLayout>
      <Page />
    </MainLayout>
  </ProtectedRoute>
);

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public Routes */}
        <Route path={routes.home} element={<Home />} />
        <Route path={routes.login} element={<Login />} />
        <Route path={routes.signup} element={<Signup />} />
        <Route path={routes.forgotPassword} element={<ForgotPassword />} />
        <Route path={routes.authCallback} element={<AuthCallback />} />
        <Route
          path={routes.onboarding}
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        <Route path={routes.about} element={<About />} />

        {/* Protected Routes */}
        <Route path={routes.dashboard} element={protectedPage(Dashboard)} />
        <Route path={routes.events} element={protectedPage(Events)} />
        <Route path={routes.eventDetail} element={protectedPage(EventDetail)} />
        <Route path={routes.chat} element={protectedPage(Chat)} />
        <Route path={routes.groups} element={protectedPage(Groups)} />
        <Route path={routes.files} element={protectedPage(Files)} />
        <Route path={routes.profile} element={protectedPage(Profile)} />
        <Route path={routes.settings} element={protectedPage(Settings)} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={routes.home} />} />
      </Routes>
    </Suspense>
  );
}

export default App;
