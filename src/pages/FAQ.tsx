
import React from 'react';
import Navbar from '@/components/Navbar';
import AccordionFaq from '@/components/AccordionFaq';

const FAQ = () => {
  return (
    <div className="min-h-screen bg-blox-gradient">
      <div className="container mx-auto px-4 py-8">
        <Navbar />
        
        <h1 className="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h1>
        
        <AccordionFaq />
      </div>
    </div>
  );
};

export default FAQ;
