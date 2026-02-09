import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { PetProfile as PetProfileType } from '../types';

const PetProfile: React.FC = () => {
  const [profile, setProfile] = useState<Partial<PetProfileType>>({
    species: 'Kat',
    name: '',
    breed: '',
    allergies: '',
    priorities: '',
  });

  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('pet_profile');
    if (stored) {
      setProfile(JSON.parse(stored));
    }
  }, []);

  const handleChange = (field: keyof PetProfileType, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!profile.name) {
      setMessage({ text: 'Naam is verplicht.', type: 'error' });
      return;
    }
    
    // Add an ID if not exists
    const toSave = { ...profile, id: profile.id || Date.now().toString() };
    localStorage.setItem('pet_profile', JSON.stringify(toSave));
    setMessage({ text: 'Profiel succesvol opgeslagen.', type: 'success' });
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <Layout title="Huisdier Profiel">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-soft border border-shibui-stone p-6 md:p-10">
          
          <div className="mb-8 border-b border-gray-100 pb-4">
             <h2 className="text-xl font-bold font-serif text-shibui-charcoal">Jouw Maatje</h2>
             <p className="text-sm text-gray-500">Stel de voorkeuren en eigenschappen in voor betere voedingsadviezen.</p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg text-sm flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              {message.type === 'success' && <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
              {message.text}
            </div>
          )}

          <div className="space-y-6">
            
            {/* Soort */}
            <div className="flex gap-4">
              {['Kat', 'Hond'].map((type) => (
                <button
                  key={type}
                  onClick={() => handleChange('species', type)}
                  className={`flex-1 py-4 rounded-xl text-base font-medium transition-all duration-300 border ${
                    profile.species === type 
                      ? 'bg-shibui-moss text-white border-shibui-moss shadow-md' 
                      : 'bg-white text-gray-500 border-shibui-stone hover:border-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <InputGroup label="Naam *">
                <input 
                  type="text" 
                  value={profile.name} 
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full bg-shibui-paper/50 border border-shibui-stone rounded-lg px-4 py-3 focus:outline-none focus:border-shibui-moss focus:ring-1 focus:ring-shibui-moss/50 transition-all"
                  placeholder="Bijv. Minoes"
                />
              </InputGroup>

              <InputGroup label="Ras">
                <input 
                  type="text" 
                  value={profile.breed} 
                  onChange={(e) => handleChange('breed', e.target.value)}
                  className="w-full bg-shibui-paper/50 border border-shibui-stone rounded-lg px-4 py-3 focus:outline-none focus:border-shibui-moss focus:ring-1 focus:ring-shibui-moss/50 transition-all"
                  placeholder="Europese Korthaar"
                />
              </InputGroup>
            </div>

            <div className="flex gap-6">
              <div className="flex-1">
                <InputGroup label="Leeftijd (jaren)">
                  <input 
                    type="number" 
                    value={profile.age || ''} 
                    onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
                    className="w-full bg-shibui-paper/50 border border-shibui-stone rounded-lg px-4 py-3 focus:outline-none focus:border-shibui-moss focus:ring-1 focus:ring-shibui-moss/50 transition-all"
                  />
                </InputGroup>
              </div>
              <div className="flex-1">
                <InputGroup label="Gewicht (kg)">
                  <input 
                    type="number" 
                    step="0.1"
                    value={profile.weight || ''} 
                    onChange={(e) => handleChange('weight', parseFloat(e.target.value) || 0)}
                    className="w-full bg-shibui-paper/50 border border-shibui-stone rounded-lg px-4 py-3 focus:outline-none focus:border-shibui-moss focus:ring-1 focus:ring-shibui-moss/50 transition-all"
                  />
                </InputGroup>
              </div>
            </div>

            <InputGroup label="Allergieën">
              <input 
                type="text" 
                value={profile.allergies} 
                onChange={(e) => handleChange('allergies', e.target.value)}
                className="w-full bg-shibui-paper/50 border border-shibui-stone rounded-lg px-4 py-3 focus:outline-none focus:border-shibui-moss focus:ring-1 focus:ring-shibui-moss/50 transition-all"
                placeholder="Bijv. Kip, Granen"
              />
              <p className="text-xs text-gray-400 mt-1">Komma-gescheiden lijst.</p>
            </InputGroup>

            <InputGroup label="Prioriteiten">
               <textarea 
                value={profile.priorities} 
                onChange={(e) => handleChange('priorities', e.target.value)}
                rows={3}
                className="w-full bg-shibui-paper/50 border border-shibui-stone rounded-lg px-4 py-3 focus:outline-none focus:border-shibui-moss focus:ring-1 focus:ring-shibui-moss/50 transition-all resize-none"
                placeholder="Wat vind je belangrijk?"
              />
            </InputGroup>

            <div className="pt-4">
               <button 
                onClick={handleSave}
                className="w-full bg-shibui-moss hover:bg-shibui-mossLight text-white font-medium py-4 rounded-xl shadow-lg shadow-green-900/10 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Opslaan
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const InputGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs uppercase tracking-wider text-gray-500 font-bold ml-1">{label}</label>
    {children}
  </div>
);

export default PetProfile;