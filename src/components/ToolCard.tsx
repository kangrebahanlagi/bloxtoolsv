
import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { siteConfig } from '@/config/toolsConfig';

interface ToolCardProps {
  title: string;
  tag?: string;
  description: string;
  features: string[];
  buttonText?: string;
  buttonLink: string;
  toolName: string;
}

const ToolCard: React.FC<ToolCardProps> = ({
  title,
  tag = siteConfig.name,
  description,
  features,
  buttonText = "Try Now",
  buttonLink,
  toolName
}) => {
  return (
    <motion.div 
      className="blox-card h-full flex flex-col"
      whileHover={{ y: -8, boxShadow: '0 15px 30px rgba(0, 215, 220, 0.2)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="p-6 flex-1">
        <motion.h2 
          className="text-xl font-bold mb-1 flex items-center gap-2"
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          {title} <span className="text-sm text-blox-teal">({tag})</span>
        </motion.h2>
        
        <motion.p 
          className="text-gray-400 mb-6 border-b border-white/10 pb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {description}
        </motion.p>
        
        <div className="space-y-3">
          {features.map((feature, index) => (
            <motion.div 
              key={index} 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.2, duration: 0.4, ease: "easeOut" }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: index * 0.5 }}
              >
                <Check className="text-blox-teal" size={18} />
              </motion.div>
              <span className="text-gray-300">{feature}</span>
            </motion.div>
          ))}
        </div>
      </div>
      
      <div className="p-6 border-t border-white/10 mt-6">
        <motion.h3 
          className="font-bold mb-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          Try it now!
        </motion.h3>
        <motion.p 
          className="text-gray-400 text-sm mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          {toolName}
        </motion.p>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <Link 
            to={buttonLink}
            className="blox-button inline-flex"
          >
            {buttonText} <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ToolCard;
