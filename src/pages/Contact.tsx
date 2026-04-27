
import React from 'react';
import Navbar from '@/components/Navbar';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

const Contact = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent! We'll get back to you soon.");
  };

  return (
    <div className="min-h-screen bg-blox-gradient">
      <div className="container mx-auto px-4 py-8">
        <Navbar />
        
        <div className="max-w-2xl mx-auto my-12">
          <h1 className="text-4xl font-bold mb-8 text-center">Contact Us</h1>
          
          <div className="blox-card p-8">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-white mb-2">Name</label>
                <input 
                  type="text" 
                  className="w-full bg-black/30 border border-white/10 rounded-md p-3 text-white focus:outline-none focus:border-blox-teal"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-white mb-2">Email</label>
                <input 
                  type="email" 
                  className="w-full bg-black/30 border border-white/10 rounded-md p-3 text-white focus:outline-none focus:border-blox-teal"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-white mb-2">Message</label>
                <textarea 
                  className="w-full bg-black/30 border border-white/10 rounded-md p-3 text-white focus:outline-none focus:border-blox-teal min-h-[150px]"
                  required
                ></textarea>
              </div>
              
              <button 
                type="submit"
                className="blox-button w-full justify-center"
              >
                Send Message <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
