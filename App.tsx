import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Finder from './pages/Finder';
import PetProfile from './pages/PetProfile';
import Blogs from './pages/Blogs';
import Brands from './pages/Brands';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/finder" element={<Finder />} />
        <Route path="/profile" element={<PetProfile />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/brands" element={<Brands />} />
      </Routes>
    </HashRouter>
  );
};

export default App;