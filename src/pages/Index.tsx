
import React from 'react';
import Navbar from '@/components/Navbar';
import { Star, ArrowRight, Code, Users, Shirt, Gamepad2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import { siteConfig } from '@/config/toolsConfig';
import { useSite } from '@/context/SiteContext';

const Index = () => {
  const { basePath } = useSite();
  const prefix = basePath || '';
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-blox-gradient overflow-x-hidden">
      <div className="container mx-auto px-4 py-8">
        <Navbar />
        
        <motion.div 
          className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto mt-16 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div 
            className="mb-2"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5, ease: "easeInOut" }}
          >
            <motion.div
              animate={{ 
                rotate: [0, 5, 0, -5, 0],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Star className="text-yellow-400 h-10 w-10" fill="currentColor" />
            </motion.div>
          </motion.div>
          
          <motion.h1 
            className="text-6xl font-bold mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
          >
            <motion.span 
              className="text-white"
              animate={{ 
                textShadow: ["0 0 5px rgba(255,255,255,0)", "0 0 15px rgba(255,255,255,0.5)", "0 0 5px rgba(255,255,255,0)"]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              {siteConfig.name.slice(0, 4)}
            </motion.span>
            <motion.span 
              className="text-blox-teal"
              animate={{ 
                textShadow: ["0 0 5px rgba(168, 85, 247,0)", "0 0 15px rgba(168, 85, 247,0.5)", "0 0 5px rgba(168, 85, 247,0)"]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            >
              {siteConfig.name.slice(4)}
            </motion.span>
          </motion.h1>
          
          <motion.div
            className="text-gray-300 text-lg mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
          >
            <TypeAnimation
              sequence={[
                'Easy to use tools, with detailed instructions!',
                1500,
                'Copy shirts, pants, and more with ease!',
                1500,
                'Bot followers to grow your popularity!',
                1500,
                'Copy games with our advanced tools!',
                1500,
              ]}
              wrapper="p"
              speed={50}
              repeat={Infinity}
              className="min-h-[60px]"
            />
            <motion.p 
              className="mt-4 text-gray-400/70 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              [ If your account is younger than 100 days it will not work its to prevent from flooding our tools ]
            </motion.p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to={`${prefix}/tools`}
              className="blox-button"
            >
              Start <ArrowRight size={18} />
            </Link>
          </motion.div>
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16 w-full"
          >
            <motion.div
              variants={itemVariants}
              className="blox-card p-6 flex flex-col items-center text-center"
              whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(168, 85, 247, 0.15)" }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-blox-teal/20 p-4 rounded-full mb-4">
                <Users className="h-8 w-8 text-blox-teal" />
              </div>
              <h3 className="text-xl font-bold mb-2">Bot Followers</h3>
              <p className="text-gray-400 text-sm">
                Grow your following with our advanced botting system. Increase your profile visibility and popularity.
              </p>
            </motion.div>
            
            <motion.div
              variants={itemVariants}
              className="blox-card p-6 flex flex-col items-center text-center"
              whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(168, 85, 247, 0.15)" }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-blox-teal/20 p-4 rounded-full mb-4">
                <Shirt className="h-8 w-8 text-blox-teal" />
              </div>
              <h3 className="text-xl font-bold mb-2">Clothing Copier</h3>
              <p className="text-gray-400 text-sm">
                Copy any clothing design quickly and easily. Build your catalog with the best designs from the platform.
              </p>
            </motion.div>
            
            <motion.div
              variants={itemVariants}
              className="blox-card p-6 flex flex-col items-center text-center"
              whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(168, 85, 247, 0.15)" }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-blox-teal/20 p-4 rounded-full mb-4">
                <Gamepad2 className="h-8 w-8 text-blox-teal" />
              </div>
              <h3 className="text-xl font-bold mb-2">Game Copier</h3>
              <p className="text-gray-400 text-sm">
                Clone popular games with our powerful game copying tool. Learn from existing games or start your own.
              </p>
            </motion.div>
            
            <motion.div
              variants={itemVariants}
              className="blox-card p-6 flex flex-col items-center text-center"
              whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(168, 85, 247, 0.15)" }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-blox-teal/20 p-4 rounded-full mb-4">
                <Code className="h-8 w-8 text-blox-teal" />
              </div>
              <h3 className="text-xl font-bold mb-2">Advanced API</h3>
              <p className="text-gray-400 text-sm">
                Our tools utilize sophisticated APIs to ensure success rates higher than any competitor.
              </p>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="w-full mt-16 p-6 blox-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            <h3 className="text-xl font-bold mb-4 text-center">Why Choose Us?</h3>
            <motion.ul className="space-y-3">
              {[
                "Industry-leading success rates",
                "Advanced security protocols",
                "24/7 automatic processing",
                "Active development and updates",
                "Service across all regions"
              ].map((item, index) => (
                <motion.li 
                  key={index}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 + (index * 0.1), duration: 0.3 }}
                >
                  <div className="h-2 w-2 bg-blox-teal rounded-full"></div>
                  <span className="text-gray-300">{item}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
