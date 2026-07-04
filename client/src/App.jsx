// // // import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// // // import { Toaster } from 'react-hot-toast';
// // // import { AuthProvider } from './context/AuthContext';
// // // import { ThemeProvider } from './context/ThemeContext';
// // // import { PlanProvider } from './context/PlanContext';
// // // import ProtectedRoute from './components/layout/ProtectedRoute';

// // // // Pages
// // // import Landing from './pages/Landing';
// // // import Login from './pages/Login';
// // // import Register from './pages/Register';

// // // // Lazy load heavy pages
// // // import { lazy, Suspense } from 'react';
// // // const Dashboard = lazy(() => import('./pages/Dashboard'));
// // // const Chat = lazy(() => import('./pages/Chat'));
// // // const MetaIntegration = lazy(() => import('./pages/MetaIntegration'));
// // // const Settings = lazy(() => import('./pages/Settings'));
// // // const AdminPanel = lazy(() => import('./pages/AdminPanel'));
// // // const Billing = lazy(() => import('./pages/Billing'));

// // // const PageLoader = () => (
// // //   <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
// // //     <span style={{ color: 'var(--text-3)', fontSize: 13 }}>Loading...</span>
// // //   </div>
// // // );

// // // export default function App() {
// // //   return (
// // //     <ThemeProvider>
// // //       <AuthProvider>
// // //         <PlanProvider>
// // //           <BrowserRouter>
// // //             <Toaster
// // //               position="top-right"
// // //               toastOptions={{
// // //                 style: {
// // //                   background: 'var(--bg-secondary)',
// // //                   color: 'var(--text)',
// // //                   border: '1px solid var(--border)',
// // //                   fontSize: 13,
// // //                 },
// // //               }}
// // //             />
// // //             <Suspense fallback={<PageLoader />}>
// // //               <Routes>
// // //                 {/* Public Routes */}
// // //                 <Route path="/" element={<Landing />} />
// // //                 <Route path="/login" element={<Login />} />
// // //                 <Route path="/register" element={<Register />} />

// // //                 {/* Protected Routes — Firebase auth required */}
// // //                 <Route element={<ProtectedRoute />}>
// // //                   <Route path="/dashboard" element={<Dashboard />} />
// // //                   <Route path="/chat" element={<Chat />} />
// // //                   <Route path="/meta" element={<MetaIntegration />} />
// // //                   <Route path="/settings" element={<Settings />} />
// // //                   <Route path="/billing" element={<Billing />} />
// // //                   <Route path="/admin" element={<AdminPanel />} />
// // //                 </Route>

// // //                 {/* 404 */}
// // //                 <Route path="*" element={<Navigate to="/" replace />} />
// // //               </Routes>
// // //             </Suspense>
// // //           </BrowserRouter>
// // //         </PlanProvider>
// // //       </AuthProvider>
// // //     </ThemeProvider>
// // //   );
// // // }



// // import { lazy, Suspense } from 'react';
// // import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// // import { Toaster } from 'react-hot-toast';
// // import { AuthProvider } from './context/AuthContext';
// // import { ThemeProvider } from './context/ThemeContext';
// // import { PlanProvider } from './context/PlanContext';
// // import ProtectedRoute from './components/layout/ProtectedRoute';
// // import Landing from './pages/Landing';
// // import Login from './pages/Login';
// // import Register from './pages/Register';
// // import PrivacyPolicy from "./pages/PrivacyPolicy";

// // const Dashboard = lazy(() => import('./pages/Dashboard'));
// // const Chat = lazy(() => import('./pages/Chat'));
// // const MetaIntegration = lazy(() => import('./pages/MetaIntegration'));
// // const Settings = lazy(() => import('./pages/Settings'));
// // const Billing = lazy(() => import('./pages/Billing'));
// // const AdminPanel = lazy(() => import('./pages/AdminPanel'));

// // function PageLoader() {
// //   return (
// //     <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
// //       <span style={{ color: 'var(--text-3)', fontSize: 13 }}>Loading...</span>
// //     </div>
// //   );
// // }

// // export default function App() {
// //   return (
// //     <ThemeProvider>
// //       <AuthProvider>
// //         <PlanProvider>
// //           <BrowserRouter>
// //             <Toaster
// //               position="top-right"
// //               toastOptions={{
// //                 style: {
// //                   background: 'var(--bg-secondary)',
// //                   color: 'var(--text)',
// //                   border: '1px solid var(--border)',
// //                   fontSize: 13,
// //                 },
// //                 success: { iconTheme: { primary: 'var(--green)', secondary: '#fff' } },
// //                 error: { iconTheme: { primary: 'var(--red)', secondary: '#fff' } },
// //               }}
// //             />
// //             <Suspense fallback={<PageLoader />}>
// //               <Routes>
// //                 <Route path="/" element={<Landing />} />
// //                 <Route path="/login" element={<Login />} />
// //                 <Route path="/register" element={<Register />} />

// //                 <Route element={<ProtectedRoute />}>
// //                   <Route path="/dashboard" element={<Dashboard />} />
// //                   <Route path="/chat" element={<Chat />} />
// //                   <Route path="/meta" element={<MetaIntegration />} />
// //                   <Route path="/settings" element={<Settings />} />
// //                   <Route path="/billing" element={<Billing />} />
// //                   <Route path="/admin" element={<AdminPanel />} />
// //                 </Route>

// //                 <Route path="*" element={<Navigate to="/" replace />} />
// //               </Routes>
// //             </Suspense>
// //           </BrowserRouter>
// //         </PlanProvider>
// //       </AuthProvider>
// //     </ThemeProvider>
// //   );
// // }


// import { lazy, Suspense } from 'react';
// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import { Toaster } from 'react-hot-toast';
// import { AuthProvider } from './context/AuthContext';
// import { ThemeProvider } from './context/ThemeContext';
// import { PlanProvider } from './context/PlanContext';
// import ProtectedRoute from './components/layout/ProtectedRoute';
// import Landing from './pages/Landing';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import PrivacyPolicy from "./pages/PrivacyPolicy";

// const Dashboard = lazy(() => import('./pages/Dashboard'));
// const Chat = lazy(() => import('./pages/Chat'));
// const MetaIntegration = lazy(() => import('./pages/MetaIntegration'));
// const Settings = lazy(() => import('./pages/Settings'));
// const Billing = lazy(() => import('./pages/Billing'));
// const AdminPanel = lazy(() => import('./pages/AdminPanel'));
// const Orders = lazy(() => import('./pages/Orders'));
// const ApiDocs = lazy(() => import('./pages/ApiDocs'));
// const BusinessConfig = lazy(() => import('./pages/BusinessConfig'));


// function PageLoader() {
//   return (
//     <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
//       <span style={{ color: 'var(--text-3)', fontSize: 13 }}>Loading...</span>
//     </div>
//   );
// }

// export default function App() {
//   return (
//     <ThemeProvider>
//       <AuthProvider>
//         <PlanProvider>
//           <BrowserRouter>
//             <Toaster
//               position="top-right"
//               toastOptions={{
//                 style: {
//                   background: 'var(--bg-secondary)',
//                   color: 'var(--text)',
//                   border: '1px solid var(--border)',
//                   fontSize: 13,
//                 },
//                 success: { iconTheme: { primary: 'var(--green)', secondary: '#fff' } },
//                 error: { iconTheme: { primary: 'var(--red)', secondary: '#fff' } },
//               }}
//             />
//             <Suspense fallback={<PageLoader />}>
//               <Routes>
//                 {/* Public Routes */}
//                 <Route path="/" element={<Landing />} />
//                 <Route path="/login" element={<Login />} />
//                 <Route path="/register" element={<Register />} />
//                 <Route path="/privacy-policy" element={<PrivacyPolicy />} />
//                 <Route path="/api-docs" element={<ApiDocs />} />

//                 {/* Protected Routes */}
//                 <Route element={<ProtectedRoute />}>
//                   <Route path="/dashboard" element={<Dashboard />} />
//                   <Route path="/chat" element={<Chat />} />
//                   <Route path="/meta" element={<MetaIntegration />} />
//                   <Route path="/settings" element={<Settings />} />
//                   <Route path="/billing" element={<Billing />} />
//                   <Route path="/admin" element={<AdminPanel />} />
//                   <Route path="/orders" element={<Orders />} />
//                   <Route path="/business-setup" element={<ProtectedRoute><BusinessConfig /></ProtectedRoute>} />
//                 </Route>

//                 {/* 404 */}
//                 <Route path="*" element={<Navigate to="/" replace />} />
//               </Routes>
//             </Suspense>
//           </BrowserRouter>
//         </PlanProvider>
//       </AuthProvider>
//     </ThemeProvider>
//   );
// }












// import { lazy, Suspense } from 'react';
// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import { Toaster } from 'react-hot-toast';
// import { AuthProvider } from './context/AuthContext';
// import { ThemeProvider } from './context/ThemeContext';
// import { PlanProvider } from './context/PlanContext';
// import ProtectedRoute from './components/layout/ProtectedRoute';
// import Landing from './pages/Landing';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import PrivacyPolicy from "./pages/PrivacyPolicy";
// import ForgotPassword from './pages/ForgotPassword';
// import DashboardLayout from './components/DashboardLayout';

// const Dashboard = lazy(() => import('./pages/Dashboard'));
// const Chat = lazy(() => import('./pages/Chat'));
// const MetaIntegration = lazy(() => import('./pages/MetaIntegration'));
// const Settings = lazy(() => import('./pages/Settings'));
// const Billing = lazy(() => import('./pages/Billing'));
// const AdminPanel = lazy(() => import('./pages/AdminPanel'));
// const Orders = lazy(() => import('./pages/Orders'));
// const ApiDocs = lazy(() => import('./pages/ApiDocs'));
// const BusinessConfig = lazy(() => import('./pages/BusinessConfig'));
// const Inbox = lazy(() => import('./pages/Inbox'));
// const Agents = lazy(() => import('./pages/Agents'));
// const Broadcast = lazy(() => import('./pages/Broadcast'));
// const ImportContacts = lazy(() => import('./pages/ImportContacts'));
// const CrmTable = lazy(() => import('./pages/CrmTable'));
// const CrmSetup = lazy(() => import('./pages/CrmSetup'));


// function PageLoader() {
//   return (
//     <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
//       <span style={{ color: 'var(--text-3)', fontSize: 13 }}>Loading...</span>
//     </div>
//   );
// }

// export default function App() {
//   return (
//     <ThemeProvider>
//       <AuthProvider>
//         <PlanProvider>
//           <BrowserRouter>
//             <Toaster
//               position="top-right"
//               toastOptions={{
//                 style: {
//                   background: 'var(--bg-secondary)',
//                   color: 'var(--text)',
//                   border: '1px solid var(--border)',
//                   fontSize: 13,
//                 },
//                 success: { iconTheme: { primary: 'var(--green)', secondary: '#fff' } },
//                 error: { iconTheme: { primary: 'var(--red)', secondary: '#fff' } },
//               }}
//             />
//             <Suspense fallback={<PageLoader />}>
//               <Routes>
//                 {/* Public Routes */}
//                 <Route path="/" element={<Landing />} />
//                 <Route path="/login" element={<Login />} />
//                 <Route path="/register" element={<Register />} />
//                 <Route path="/privacy-policy" element={<PrivacyPolicy />} />
//                 <Route path="/api-docs" element={<ApiDocs />} />
//                 <Route path="/forgot-password" element={<ForgotPassword />} />

//                 {/* Protected Routes */}
//                 <Route element={<ProtectedRoute />}>
//                   <Route path="/dashboard" element={<Dashboard />} />
//                   <Route path="/chat" element={<Chat />} />
//                   <Route path="/meta" element={<MetaIntegration />} />
//                   <Route path="/settings" element={<Settings />} />
//                   <Route path="/billing" element={<Billing />} />
//                   <Route path="/admin" element={<AdminPanel />} />
//                   <Route path="/orders" element={<Orders />} />
//                   <Route path="/business-setup" element={<BusinessConfig />} />
//                   <Route path="/inbox" element={<Inbox />} />
//                   <Route path="/agents" element={<Agents />} />
//                   <Route path="/broadcast" element={<Broadcast />} />
//                   <Route path="/import-contacts" element={<ImportContacts />} />
//                   <Route path="/crm" element={<CrmTable />} />
//                   <Route path="/crm-setup" element={<CrmSetup />} />
//                 </Route>

//                 {/* 404 */}
//                 <Route path="*" element={<Navigate to="/" replace />} />
//               </Routes>
//             </Suspense>
//           </BrowserRouter>
//         </PlanProvider>
//       </AuthProvider>
//     </ThemeProvider>
//   );
// }
















import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PlanProvider } from './context/PlanContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AcceptInvite from './pages/AcceptInvite';
import Subscribe from './pages/Subscribe';
import SubscriptionAdmin from './pages/SubscriptionAdmin';
import Leads from './pages/Leads';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Chat = lazy(() => import('./pages/Chat'));
const MetaIntegration = lazy(() => import('./pages/MetaIntegration'));
const Settings = lazy(() => import('./pages/Settings'));
const Billing = lazy(() => import('./pages/Billing'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Orders = lazy(() => import('./pages/Orders'));
const ApiDocs = lazy(() => import('./pages/ApiDocs'));
const BusinessConfig = lazy(() => import('./pages/BusinessConfig'));
const Inbox = lazy(() => import('./pages/Inbox'));
const Agents = lazy(() => import('./pages/Agents'));
const Broadcast = lazy(() => import('./pages/Broadcast'));
const ImportContacts = lazy(() => import('./pages/ImportContacts'));
const CrmTable = lazy(() => import('./pages/CrmTable'));
const CrmSetup = lazy(() => import('./pages/CrmSetup'));

function PageLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <span style={{ color: 'var(--text-3)', fontSize: 13 }}>Loading...</span>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PlanProvider>
          <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{
                style: { background: 'var(--bg-secondary)', color: 'var(--text)', border: '1px solid var(--border)', fontSize: 13 },
                success: { iconTheme: { primary: 'var(--green)', secondary: '#fff' } },
                error: { iconTheme: { primary: 'var(--red)', secondary: '#fff' } },
              }}
            />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/api-docs" element={<ApiDocs />} />
                <Route path="/accept-invite" element={<AcceptInvite />} />

                {/* Protected + Sidebar Layout */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/inbox" element={<Inbox />} />
                    <Route path="/crm" element={<CrmTable />} />
                    <Route path="/crm-setup" element={<CrmSetup />} />
                    <Route path="/broadcast" element={<Broadcast />} />
                    <Route path="/import-contacts" element={<ImportContacts />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/meta" element={<MetaIntegration />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/business-setup" element={<BusinessConfig />} />
                    <Route path="/agents" element={<Agents />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/billing" element={<Billing />} />
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="/subscribe" element={<Subscribe />} />
                    <Route path="/subscription-admin" element={<SubscriptionAdmin />} />
                    <Route path="/leads" element={<Leads />} />
                  </Route>
                </Route>

                {/* 404 */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </PlanProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}