
import React from 'react';
import Navbar from '@/components/Navbar';
import ToolCard from '@/components/ToolCard';
import { motion } from 'framer-motion';
import { useSite } from '@/context/SiteContext';

const Tools = () => {
  const { basePath } = useSite();
  const prefix = basePath || '';
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-blox-gradient">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Navbar />
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <ToolCard
              title="Group Botter"
              description="Mass-join any Roblox group with thousands of bots."
              features={[
                "Bulk group joining",
                "Class S Support",
                "Configurable amount",
                "High success rate"
              ]}
              buttonLink={`${prefix}/group-botter`}
              toolName="Group Botter Tool"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <ToolCard
              title="VC Enabler"
              description="Enable voice chat on any Roblox account instantly."
              features={[
                "Bypasses age verification",
                "Class S Support",
                "Unlimited uses",
                "Works on most accounts"
              ]}
              buttonLink={`${prefix}/vc-enabler`}
              toolName="VC Enabler Tool"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <ToolCard
              title="Copy Games"
              description="Copy any game super efficiently and with ease!"
              features={[
                "Advanced game copy AI",
                "Class S Support",
                "Frequent Updates",
                "Multiple working bots"
              ]}
              buttonLink={`${prefix}/copy-games`}
              toolName="Copy Games Tool"
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <ToolCard
              title="Copy Clothes"
              description="Fastest clothing copier! Faster then the competition."
              features={[
                "Fast and easy shirt copier",
                "Class S Support",
                "Unlimited uses",
                "Advanced clothing copying bots"
              ]}
              buttonLink={`${prefix}/copy-clothes`}
              toolName="Copy Clothes Tool"
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <ToolCard
              title="Follow Bot"
              description="This tool used to cost money but we made it free!"
              features={[
                "Thousands of bots ready to follow",
                "Class S Support",
                "Unlimited uses",
                "100% uptime to date"
              ]}
              buttonLink={`${prefix}/bot-followers`}
              toolName="Follow Bot Tool"
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Tools;
