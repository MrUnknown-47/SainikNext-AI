"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  
  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Career Coach", path: "/career-coach" },
    { name: "Career Explorer", path: "/career-explorer" },
    { name: "Resume Builder", path: "/resume-builder" }
  ];

  return (
    <div className="w-64 h-screen fixed top-0 left-0 bg-gray-950 border-r border-gray-800 flex flex-col p-6 z-50">
      <div className="flex items-center gap-3 mb-10 mt-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-500 to-blue-500 flex items-center justify-center shadow-lg shadow-green-500/20">
           <span className="font-bold text-white text-xl">S</span>
        </div>
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 tracking-tight">SainikNext</h1>
      </div>
      
      <nav className="flex flex-col gap-2">
        {Array.isArray(navItems) && navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.name} 
              href={item.path} 
              className={`px-4 py-3 rounded-lg transition-all duration-300 font-medium tracking-wide ${
                isActive 
                  ? 'bg-blue-600/10 text-white border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-900 border border-transparent'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 rounded-xl bg-gray-900 border border-gray-800">
         <p className="text-xs text-gray-500 leading-relaxed font-medium">Secured with enterprise integration endpoints.</p>
      </div>
    </div>
  );
}
