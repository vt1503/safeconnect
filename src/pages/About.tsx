import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

const About: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
            <h1 className="text-xl font-semibold text-gray-900">{t('about.title')}</h1>
            <div className="w-10"></div> {/* Spacer */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-20 pb-10 px-4 max-w-screen-lg mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">{t('about.app_name')}</h2>
          <p className="text-gray-600 mb-4">
            {t('about.description')}
          </p>
          
          <div className="space-y-4 mt-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{t('about.version_title')}</h3>
              <p className="text-gray-600">{t('about.version_number')}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{t('about.developer_title')}</h3>
              <p className="text-gray-600">{t('about.developer_name')}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{t('about.contact_title')}</h3>
              <p className="text-gray-600">{t('about.contact_email')}</p>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-gray-400">
            <p>{t('about.copyright')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
