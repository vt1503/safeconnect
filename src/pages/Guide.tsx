import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

const Guide: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const guideSteps = [
    { 
      title: t('guide.step1_title'), 
      content: t('guide.step1_content')
    },
    { 
      title: t('guide.step2_title'), 
      content: t('guide.step2_content')
    },
    { 
      title: t('guide.step3_title'), 
      content: t('guide.step3_content')
    },
    { 
      title: t('guide.step4_title'), 
      content: t('guide.step4_content')
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
        <div className="max-w-screen-lg mx-auto">
          <div className="flex items-center justify-between p-4 h-16">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-gray-700 hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">{t('guide.title')}</h1>
            <div className="w-10"></div> {/* Spacer */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-20 pb-10 px-4 max-w-screen-lg mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-8">
          {guideSteps.map((step, index) => (
            <div key={index}>
              <h2 className="text-xl font-bold mb-2 text-gray-800 flex items-center">
                <span className="bg-red-500 text-white rounded-full h-8 w-8 flex items-center justify-center mr-3">{index + 1}</span>
                {step.title}
              </h2>
              <p className="text-gray-600 ml-11">
                {step.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Guide;
