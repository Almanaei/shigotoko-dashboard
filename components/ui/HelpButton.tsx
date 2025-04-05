import { HelpCircle } from 'lucide-react';

export default function HelpButton() {
  return (
    <button
      className="fixed bottom-6 right-6 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label="Help"
    >
      <HelpCircle className="h-6 w-6" />
    </button>
  );
} 