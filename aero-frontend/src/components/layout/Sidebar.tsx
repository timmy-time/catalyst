import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/servers', label: 'Servers' },
  { to: '/nodes', label: 'Nodes' },
  { to: '/templates', label: 'Templates' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/admin/users', label: 'Admin' },
];

function Sidebar() {
  return (
    <aside className="w-56 border-r border-slate-800 bg-slate-900/80 px-4 py-6 text-sm">
      <nav className="flex flex-col gap-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `rounded-md px-3 py-2 font-medium transition ${
                isActive ? 'bg-sky-600 text-white' : 'text-slate-200 hover:bg-slate-800'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
