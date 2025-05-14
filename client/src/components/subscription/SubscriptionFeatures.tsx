import React from 'react';
import { CheckCircle, Sparkles, MessageSquare, FileText, BookOpen } from 'lucide-react';

const SubscriptionFeatures = () => {
  return (
    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 mb-8 shadow-sm">
      <h2 className="text-2xl font-merriweather font-bold text-center mb-6 text-blue-900">
        <Sparkles className="inline-block mr-2 h-6 w-6 text-primary" />
        Premium Membership Benefits
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start p-4 bg-white rounded-lg shadow-sm">
          <CheckCircle className="h-6 w-6 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-merriweather font-semibold text-lg mb-1">Unlimited Contract Analysis</h3>
            <p className="text-gray-600">Upload all your contracts for smart AI analysis without any limitations.</p>
          </div>
        </div>
        
        <div className="flex items-start p-4 bg-white rounded-lg shadow-sm">
          <MessageSquare className="h-6 w-6 text-primary mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-merriweather font-semibold text-lg mb-1">Advanced Contract Q&A</h3>
            <p className="text-gray-600">Ask unlimited detailed questions about your contracts with priority processing.</p>
          </div>
        </div>
        
        <div className="flex items-start p-4 bg-white rounded-lg shadow-sm">
          <FileText className="h-6 w-6 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-merriweather font-semibold text-lg mb-1">Contract Comparisons</h3>
            <p className="text-gray-600">Compare multiple contracts to identify differences, advantages, and potential issues.</p>
          </div>
        </div>
        
        <div className="flex items-start p-4 bg-white rounded-lg shadow-sm">
          <BookOpen className="h-6 w-6 text-secondary mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-merriweather font-semibold text-lg mb-1">Premium Content Library</h3>
            <p className="text-gray-600">Access our full library of educational resources about union rights and contract knowledge.</p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-center text-gray-600">
        <p>All memberships include a <span className="font-semibold">7-day free trial</span> so you can experience the benefits risk-free.</p>
      </div>
    </div>
  );
};

export default SubscriptionFeatures;