'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Users } from 'lucide-react';

export default function AdminNavTabs() {
  const pathname = usePathname();

  const tabs = [
    {
      href: '/admin',
      label: 'Báo cáo & Thống kê',
      icon: BarChart3,
      isActive: pathname === '/admin',
    },
    {
      href: '/admin/staff',
      label: 'Quản lý nhân sự',
      icon: Users,
      isActive: pathname === '/admin/staff',
    },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/60 rounded-2xl w-fit mb-6 border border-slate-200/80 shadow-2xs">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all select-none ${
              tab.isActive
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Icon
              className={`h-4 w-4 ${
                tab.isActive ? 'text-slate-900' : 'text-slate-500'
              }`}
            />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
