import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
