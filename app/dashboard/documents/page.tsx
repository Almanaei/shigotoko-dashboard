'use client';

import { useState } from 'react';
import { 
  FileText, 
  Search, 
  Plus,
  FileIcon,
  Download,
  Trash2,
  Share2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Document type definition
interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
}

// Sample documents for demo
const sampleDocuments: Document[] = [
  {
    id: '1',
    name: 'Project Requirements',
    type: 'PDF',
    size: '2.4 MB',
    uploadedBy: 'Akira Tanaka',
    uploadedAt: '2024-02-15'
  },
  {
    id: '2',
    name: 'Marketing Strategy',
    type: 'DOCX',
    size: '1.8 MB',
    uploadedBy: 'Maria Rodriguez',
    uploadedAt: '2024-02-10'
  },
  {
    id: '3',
    name: 'Budget Estimates Q2',
    type: 'XLSX',
    size: '3.2 MB',
    uploadedBy: 'David Chen',
    uploadedAt: '2024-02-05'
  },
  {
    id: '4',
    name: 'UI Design Mockups',
    type: 'ZIP',
    size: '12.6 MB',
    uploadedBy: 'Sarah Kim',
    uploadedAt: '2024-01-28'
  },
  {
    id: '5',
    name: 'Employee Handbook',
    type: 'PDF',
    size: '4.1 MB',
    uploadedBy: 'James Peterson',
    uploadedAt: '2024-01-20'
  }
];

// Helper function to get the file icon based on type
const getFileIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'pdf':
      return <FileText className="h-10 w-10 text-red-500" />;
    case 'docx':
      return <FileText className="h-10 w-10 text-blue-500" />;
    case 'xlsx':
      return <FileText className="h-10 w-10 text-green-500" />;
    default:
      return <FileIcon className="h-10 w-10 text-gray-500" />;
  }
};

export default function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [documents, setDocuments] = useState<Document[]>(sampleDocuments);
  
  // Filter documents based on search term
  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Documents</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Upload Document
        </Button>
      </div>
      
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <input
          type="text"
          placeholder="Search documents..."
          className="pl-10 w-full h-10 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {filteredDocuments.length > 0 ? (
        <div className="space-y-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-4">
                  {getFileIcon(doc.type)}
                </div>
                <div className="flex-grow">
                  <h3 className="font-medium">{doc.name}</h3>
                  <div className="flex text-sm text-muted-foreground mt-1">
                    <span className="mr-4">{doc.type}</span>
                    <span className="mr-4">{doc.size}</span>
                    <span className="mr-4">Uploaded by: {doc.uploadedBy}</span>
                    <span>Date: {doc.uploadedAt}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" /> Download
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-1" /> Share
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-8 text-center">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No documents found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Try adjusting your search query" : "Upload your first document to get started"}
          </p>
        </div>
      )}
    </div>
  );
} 