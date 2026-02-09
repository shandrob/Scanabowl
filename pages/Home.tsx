import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { sheetService } from '../services/sheetService';
import { Blog, PetProfile } from '../types';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [latestBlog, setLatestBlog] = useState<Blog | null>(null);
  const [pet, setPet] = useState<PetProfile | null>(null);

  useEffect(() => {
    // Load Blog
    sheetService.getBlogs().then((blogs) => {
      if (blogs.length > 0) setLatestBlog(blogs[0]);
    });

    // Load Pet from LocalStorage
    const storedPet = localStorage.getItem('pet_profile');
    if (storedPet) {
      setPet(JSON.parse(storedPet));
    }
  }, []);

  return (
    <Layout>
      <div className="flex flex-col gap-6 md:gap-10">
        
        {/* Welcome Section */}
        <div className="text-center md:text-left py-4 border-b border-gray-200/50 md:border-none">
          <h2 className="font-serif text-2xl md:text-4xl text-shibui-charcoal mb-2">
            Welkom, {pet ? pet.name : 'Dierenvriend'}
          </h2>
          <p className="text-sm md:text-base text-gray-500 font-light">
            {pet ? 'Wat gaan we vandaag ontdekken?' : 'Start met het instellen van je profiel.'}
          </p>
        </div>

        {/* Dashboard Grid - Responsive */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          
          {/* Tile 1: Scan Barcode (New) */}
          <Tile 
            title="Scan Barcode" 
            icon="scan" 
            color="bg-shibui-charcoal text-white"
            onClick={() => navigate('/finder?scan=true')}
          />

          {/* Tile 2: Voer Zoeker */}
          <Tile 
            title="Voer Zoeker" 
            icon="search" 
            color="bg-shibui-moss/10 text-shibui-moss"
            onClick={() => navigate('/finder')}
          />

          {/* Tile 3: Profiel */}
          <Tile 
            title="Mijn Huisdier" 
            icon="pets" 
            color="bg-orange-100 text-orange-700"
            subtitle={pet ? `${pet.breed}` : 'Instellen'}
            onClick={() => navigate('/profile')}
          />

          {/* Tile 4: Merken */}
          <Tile 
            title="Merken Gids" 
            icon="star" 
            color="bg-purple-50 text-purple-700"
            onClick={() => navigate('/brands')}
          />

          {/* Tile 5: Blogs (Wide) */}
          <Tile 
            title="Kennisbank" 
            icon="article" 
            color="bg-blue-50 text-blue-700"
            subtitle={latestBlog ? 'Nieuw artikel!' : 'Lezen'}
            onClick={() => navigate('/blogs')}
            isWide={true}
          >
             {latestBlog && (
               <div className="mt-2 text-xs text-gray-600 truncate italic border-t border-gray-100 pt-2 hidden md:block">
                 "{latestBlog.title}"
               </div>
             )}
          </Tile>

        </div>

      </div>
    </Layout>
  );
};

interface TileProps {
  title: string;
  subtitle?: string;
  icon: string;
  color: string;
  onClick: () => void;
  isWide?: boolean;
  children?: React.ReactNode;
}

const Tile: React.FC<TileProps> = ({ title, subtitle, icon, color, onClick, isWide, children }) => (
  <button 
    onClick={onClick}
    className={`
      ${isWide ? 'col-span-2' : 'col-span-1'}
      bg-white rounded-2xl p-5 shadow-soft hover:shadow-md hover:-translate-y-1 transition-all duration-300 text-left border border-shibui-stone
      flex flex-col justify-between h-32 md:h-48
    `}
  >
    <div className="flex justify-between items-start w-full">
      <div className={`p-2 rounded-xl ${color}`}>
        {icon === 'search' && <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
        {icon === 'pets' && <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
        {icon === 'article' && <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>}
        {icon === 'star' && <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
        {icon === 'scan' && <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>}
      </div>
    </div>
    
    <div>
      <h3 className="font-serif font-bold text-lg md:text-xl text-shibui-charcoal">{title}</h3>
      {subtitle && <p className="text-xs md:text-sm text-gray-400 mt-1">{subtitle}</p>}
      {children}
    </div>
  </button>
);

export default Home;