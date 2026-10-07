import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Clock, TrendingUp, FolderClock, Edit, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { Button } from '@/components/ui/button';

export default function Sessions() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock sessions if database isn't hooked up perfectly yet by the user
  const mockSessions = [
    { id: '1', name: '12:30 candle 15tf', pair: 'XAU/USD', balance: 15436.70, date: '02/06/2026, 19:29' },
    { id: '2', name: 'xyz', pair: 'XAU/USD', balance: 1000.00, date: '01/01/2026, 02:29' },
    { id: '3', name: 'ema 21 souce low', pair: 'XAU/USD', balance: 32487.31, date: '01/06/2026, 04:29' },
    { id: '4', name: 'Btc', pair: 'BTC/USD', balance: 14928.98, date: '16/02/2026, 15:30' },
  ];

  useEffect(() => {
    // In a real app we fetch from /api/sessions
    // For now we will use local storage or mock to guarantee it works immediately
    const saved = localStorage.getItem('backtest_sessions');
    if (saved) {
      setSessions(JSON.parse(saved));
    } else {
      setSessions(mockSessions);
      localStorage.setItem('backtest_sessions', JSON.stringify(mockSessions));
    }
    setLoading(false);
  }, []);

  const handleEdit = (e, id, currentName) => {
    e.stopPropagation();
    const newName = window.prompt("Edit Session Name:", currentName);
    if (newName && newName.trim() !== "") {
      const updated = sessions.map(s => s.id === id ? { ...s, name: newName } : s);
      setSessions(updated);
      localStorage.setItem('backtest_sessions', JSON.stringify(updated));
    }
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this session?")) {
      const updated = sessions.filter(s => s.id !== id);
      setSessions(updated);
      localStorage.setItem('backtest_sessions', JSON.stringify(updated));
    }
  };

  const createNewSession = () => {
    const newSession = {
      id: Date.now().toString(),
      name: `New Session ${new Date().toLocaleDateString()}`,
      pair: 'BTCUSDT',
      balance: 10000.00,
      date: new Date().toLocaleString()
    };
    const updated = [newSession, ...sessions];
    setSessions(updated);
    // Removed auto-save to localStorage here as requested
    navigate(`/backtest/${newSession.id}`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto font-sans pb-24 px-4 md:px-8 mt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
            <FolderClock className="w-6 h-6 text-cyan-400" /> Your Sessions
          </h1>
          <p className="text-gray-500 mt-1 text-[13px]">
            Manage and resume your backtesting environments.
          </p>
        </div>
        <Button onClick={createNewSession} className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Session
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {sessions.map(s => (
          <div key={s.id} className="bg-[#101216] border border-white/5 rounded-xl p-5 hover:bg-[#15181D] hover:border-white/10 transition-all group flex flex-col justify-between min-h-[160px] relative">
            
            <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button onClick={(e) => handleEdit(e, s.id, s.name)} className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Edit">
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button onClick={(e) => handleDelete(e, s.id)} className="p-1.5 rounded-md bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors" title="Delete">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex justify-between items-start mb-4 mt-1">
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[11px] w-full">
                <span className="text-gray-500 font-bold">Name:</span>
                <span className="text-white text-right font-medium truncate pr-16">{s.name}</span>
                
                <span className="text-gray-500 font-bold">Pair:</span>
                <span className="text-white text-right font-medium">{s.pair}</span>
                
                <span className="text-gray-500 font-bold">Balance:</span>
                <span className="text-emerald-400 text-right font-mono font-bold">${s.balance.toFixed(2)}</span>
                
                <span className="text-gray-500 font-bold">Date:</span>
                <span className="text-gray-400 text-right">{s.date}</span>
              </div>
            </div>

            <div className="flex justify-end mt-auto pt-2">
              <button onClick={() => navigate(`/backtest/${s.id}`)} className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 hover:bg-cyan-500 hover:text-black transition-colors">
                <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
