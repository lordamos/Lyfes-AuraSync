
import React, { useState } from 'react';
import { IndividualBirthData } from '../types';

interface BirthFormProps {
  onGenerate: (data: IndividualBirthData[]) => void;
}

const generateUniqueId = () => Math.random().toString(36).substring(2, 9);

export const BirthForm: React.FC<BirthFormProps> = ({ onGenerate }) => {
  const [individuals, setIndividuals] = useState<IndividualBirthData[]>([
    { id: generateUniqueId(), name: '', date: '', time: '', place: '', role: 'primary' },
  ]);
  const [canAddPartner, setCanAddPartner] = useState(true);
  const [canAddChild, setCanAddChild] = useState(true); // Limit to 2 children for now

  const handleChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setIndividuals(prev => 
      prev.map(person => person.id === id ? { ...person, [name]: value } : person)
    );
  };

  const addIndividual = (role: 'partner' | 'child') => {
    if (role === 'partner' && !canAddPartner) return;
    if (role === 'child' && !canAddChild) return;

    setIndividuals(prev => [...prev, { id: generateUniqueId(), name: '', date: '', time: '', place: '', role }]);
    if (role === 'partner') setCanAddPartner(false);
    if (role === 'child') setCanAddChild(individuals.filter(p => p.role === 'child').length < 1); // Allow up to 2 children total
  };

  const removeIndividual = (id: string, role?: 'partner' | 'child') => {
    setIndividuals(prev => prev.filter(person => person.id !== id));
    if (role === 'partner') setCanAddPartner(true);
    if (role === 'child') setCanAddChild(true); // Always allow adding a child back if one is removed.
  };

  const isFormValid = individuals.every(
    person => person.name && person.date && person.time && person.place
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      onGenerate(individuals);
    }
  };

  const inputClasses = "w-full px-4 py-3 bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary dark:focus:ring-indigo-400 transition-all placeholder:text-gray-600 dark:placeholder:text-gray-400";

  return (
    <div className="glass-card p-6 sm:p-8 rounded-2xl animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-8">
        {individuals.map((person, index) => {
          let containerClass = "relative border-b pb-6 mb-6 last:border-b-0 last:pb-0 last:mb-0 border-white/20";
          let headerClass = "text-xl font-bold text-gray-900 dark:text-white mb-4";
          
          // Distinct styling for Partner
          if (person.role === 'partner') {
            containerClass = "relative p-6 rounded-xl border border-brand-secondary/30 bg-brand-secondary/5 dark:bg-brand-secondary/10 mb-6";
            headerClass = "text-xl font-bold text-brand-secondary dark:text-violet-300 mb-4";
          }
          // Distinct styling for Child
          else if (person.role === 'child') {
             containerClass = "relative p-6 rounded-xl border border-blue-400/30 bg-blue-400/5 dark:bg-blue-900/10 mb-6";
             headerClass = "text-xl font-bold text-blue-600 dark:text-blue-300 mb-4";
          }

          return (
            <div key={person.id} className={containerClass}>
              {person.role === 'primary' && <h3 className={headerClass}>Your Details</h3>}
              
              {person.role === 'partner' && (
                <h3 className={`${headerClass} flex justify-between items-center`}>
                  Partner's Details
                  <button 
                    type="button" 
                    onClick={() => removeIndividual(person.id, 'partner')} 
                    className="text-red-400 hover:text-red-500 text-sm font-semibold px-3 py-1 rounded hover:bg-red-100/10 transition-colors"
                  >
                    Remove
                  </button>
                </h3>
              )}
              
              {person.role === 'child' && (
                <h3 className={`${headerClass} flex justify-between items-center`}>
                  Child {individuals.filter(p => p.role === 'child').indexOf(person) + 1}'s Details
                  <button 
                    type="button" 
                    onClick={() => removeIndividual(person.id, 'child')} 
                    className="text-red-400 hover:text-red-500 text-sm font-semibold px-3 py-1 rounded hover:bg-red-100/10 transition-colors"
                  >
                    Remove
                  </button>
                </h3>
              )}
              
              <div className="space-y-6">
                <div>
                  <label htmlFor={`name-${person.id}`} className="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-1">Full Name</label>
                  <input type="text" id={`name-${person.id}`} name="name" value={person.name} onChange={(e) => handleChange(person.id, e)} placeholder="e.g., Jane Doe" className={inputClasses} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor={`date-${person.id}`} className="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-1">Birth Date</label>
                    <input type="date" id={`date-${person.id}`} name="date" value={person.date} onChange={(e) => handleChange(person.id, e)} className={inputClasses} required />
                  </div>
                  <div>
                    <label htmlFor={`time-${person.id}`} className="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-1">Birth Time</label>
                    <input type="time" id={`time-${person.id}`} name="time" value={person.time} onChange={(e) => handleChange(person.id, e)} className={inputClasses} required />
                  </div>
                </div>
                <div>
                  <label htmlFor={`place-${person.id}`} className="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-1">Birth Place</label>
                  <input type="text" id={`place-${person.id}`} name="place" value={person.place} onChange={(e) => handleChange(person.id, e)} placeholder="e.g., New York, USA" className={inputClasses} required />
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex justify-center space-x-4 pt-4">
          {canAddPartner && (
            <button
              type="button"
              onClick={() => addIndividual('partner')}
              className="px-4 py-2 bg-brand-secondary/80 text-white font-semibold rounded-lg shadow-md hover:bg-violet-500 transition-all duration-300 flex items-center gap-2"
            >
              <span className="text-xl">+</span> Add Partner
            </button>
          )}
          {individuals.filter(p => p.role === 'child').length < 2 && ( // Max 2 children for now
            <button
              type="button"
              onClick={() => addIndividual('child')}
              className="px-4 py-2 bg-blue-500/80 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-all duration-300 flex items-center gap-2"
            >
               <span className="text-xl">+</span> Add Child
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={!isFormValid}
          className="w-full py-4 px-4 bg-brand-primary hover:bg-brand-secondary text-white text-lg font-bold rounded-lg shadow-lg transition-all duration-300 disabled:bg-gray-500/50 disabled:dark:bg-gray-600/50 disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus:ring-4 focus:ring-brand-secondary/50 transform hover:scale-105"
        >
          Generate All Reports
        </button>
      </form>
    </div>
  );
};
