import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, title, showBack = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Home', icon: 'home', path: '/' },
    { label: 'Zoeker', icon: 'search', path: '/finder' },
    { label: 'Mijn Dier', icon: 'pets', path: '/profile' },
  ];

  return (
    <div className="min-h-screen bg-shibui-paper text-shibui-charcoal font-sans flex flex-col md:flex-row shadow-2xl md:shadow-none relative">
      
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 fixed h-full bg-white border-r border-shibui-stone p-6 z-30">
        <h1 className="font-serif text-2xl font-bold text-shibui-ink mb-10 tracking-wide">
          Scanabowl
        </h1>
        <nav className="flex flex-col space-y-2">
          {navItems.map((item) => {
             const isActive = location.pathname === item.path;
             return (
               <button
                 key={item.path}
                 onClick={() => navigate(item.path)}
                 className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                   isActive 
                   ? 'bg-shibui-moss/10 text-shibui-moss font-medium' 
                   : 'text-gray-500 hover:bg-shibui-stone/50 hover:text-shibui-charcoal'
                 }`}
               >
                 {item.icon === 'home' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                 )}
                 {item.icon === 'search' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 )}
                 {item.icon === 'pets' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                 )}
                 <span>{item.label}</span>
               </button>
             );
          })}
          {/* Extra Desktop Links */}
          <button
             onClick={() => navigate('/brands')}
             className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${location.pathname === '/brands' ? 'bg-shibui-moss/10 text-shibui-moss' : 'text-gray-500 hover:bg-shibui-stone/50'}`}
          >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
             <span>Merken</span>
          </button>
           <button
             onClick={() => navigate('/blogs')}
             className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${location.pathname === '/blogs' ? 'bg-shibui-moss/10 text-shibui-moss' : 'text-gray-500 hover:bg-shibui-stone/50'}`}
          >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
             <span>Kennisbank</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen">
        
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-10 bg-shibui-paper/90 backdrop-blur-md border-b border-shibui-stone px-6 py-4 flex items-center justify-between h-16 transition-all duration-300">
          {showBack ? (
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 -ml-2 text-shibui-charcoal hover:bg-shibui-stone rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          ) : (
            <div className="w-10"></div>
          )}
          
          <h1 className="font-serif text-xl font-medium tracking-wide text-shibui-ink">
            {title || 'Scanabowl'}
          </h1>
          
          <div className="w-10"></div>
        </header>

        {/* Main Content Scrollable */}
        <main className="flex-1 px-6 py-6 pb-24 md:pb-8 md:px-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-shibui-stone px-6 py-3 flex justify-between items-center z-20">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-16 space-y-1 transition-colors duration-300 ${isActive ? 'text-shibui-moss' : 'text-gray-400 hover:text-shibui-charcoal'}`}
            >
              {item.icon === 'home' && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive ? 0 : 1.5} className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              )}
              {item.icon === 'search' && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive ? 0 : 1.5} className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              )}
              {item.icon === 'pets' && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive ? 0 : 1.5} className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                </svg>
              )}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;