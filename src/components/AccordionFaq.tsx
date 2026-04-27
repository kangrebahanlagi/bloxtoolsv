
import React, { useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FaqItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="mb-4">
      <button
        className="w-full text-left bg-blox-teal text-white p-4 rounded-md flex justify-between items-center"
        onClick={onClick}
      >
        <span>{question}</span>
        <ChevronUp className={cn("transition-transform", isOpen ? "" : "rotate-180")} />
      </button>
      
      {isOpen && (
        <div className="bg-black/40 p-4 rounded-b-md text-gray-300 border-x border-b border-white/5">
          {answer}
        </div>
      )}
    </div>
  );
};

const AccordionFaq: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  
  const faqItems = [
    {
      question: "Will I be terminated for using this service?",
      answer: "No you will not be banned for using our services",
    },
    {
      question: "Does this break the Roblox ToS?",
      answer: "Our platform makes sure to not break any Terms of service your safety is our concern",
    },
    {
      question: "Is roblox against the use of this platform?",
      answer: "Roblox has accepted the use of our services on it's platform, and it does not abide or break the Roblox Terms of service.",
    },
    {
      question: "How long does this take?",
      answer: "The process is usually very quick, it takes only a few minutes to complete.",
    },
  ];

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-3xl mx-auto my-12">
      {faqItems.map((item, index) => (
        <FaqItem
          key={index}
          question={item.question}
          answer={item.answer}
          isOpen={openIndex === index}
          onClick={() => toggleItem(index)}
        />
      ))}
    </div>
  );
};

export default AccordionFaq;
