import { HelpCircle } from 'lucide-react';

export default function HelpButton() {
  return (
    <button
      className="fixed bottom-6 right-6 p-3 bg-[#1ABC9C] text-white rounded-full shadow-lg hover:bg-[#16a085] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1ABC9C] focus:ring-offset-2"
      aria-label="Help"
    >
      <HelpCircle className="h-6 w-6" />
    </button>
  );
} 