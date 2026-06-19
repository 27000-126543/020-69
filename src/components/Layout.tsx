import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-brand-surface">
      <Sidebar />
      <main className="ml-[220px] min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
