import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Members from './pages/members/Members';
import Tontines from './pages/tontines/Tontines';
import Seances from './pages/seances/Seances';
import Settings from './pages/settings/Settings';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right"
          toastOptions={{
            style: {
              background: '#161b27',
              color: '#e8edf5',
              border: '1px solid #2e3a50'
            }
          }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/members"   element={<Members />} />
            <Route path="/tontines"  element={<Tontines />} />
            <Route path="/seances"   element={<Seances />} />
            <Route path="/settings"  element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}