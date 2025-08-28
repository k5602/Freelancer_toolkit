
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText, Volume2, ScrollText } from 'lucide-react';
import { useThemeStore } from '../lib/themeStore';

const ToolCard = ({ icon, title, description, to }: { icon: React.ReactNode; title: string; description: string; to: string }) => (
  <Link to={to}>
    <motion.div
      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center text-center h-full"
      whileHover={{ y: -5, scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="p-3 bg-blue-500 rounded-full text-white mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </motion.div>
  </Link>
);

const Dashboard: React.FC = () => {
  const { toggleTheme } = useThemeStore();

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <motion.h1
        className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-12 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Dashboard
      </motion.h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <ToolCard
          to="/proposal-generator"
          icon={<FileText size={24} />}
          title="Proposal Generator"
          description="Create professional proposals from job descriptions or URLs."
        />
        <ToolCard
          to="/voice-responder"
          icon={<Volume2 size={24} />}
          title="Voice Responder"
          description="Generate voice responses from text for your clients."
        />
        <ToolCard
          to="/contract-generator"
          icon={<ScrollText size={24} />}
          title="Contract Generator"
          description="Quickly generate contracts based on your proposals."
        />
      </div>
      <div className="mt-8 text-center">
        <button onClick={toggleTheme} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Toggle Theme
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
