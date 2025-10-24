import { useLanguage } from '../contexts/LanguageContext';
import { Activity, Heart, Pill, Droplet, Brain, Bone, Thermometer, Leaf, Shield, Zap, User, Baby, Eye, CircleDot } from 'lucide-react';

// Custom Female User Icon with long hair
const FemaleUser = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
    {/* Long hair strands */}
    <path d="M8 11 L6 15"></path>
    <path d="M16 11 L18 15"></path>
  </svg>
);

interface DiseaseSidebarProps {
  selectedDisease: string | null;
  onSelectDisease: (disease: string | null) => void;
}

export const DiseaseSidebar = ({ selectedDisease, onSelectDisease }: DiseaseSidebarProps) => {
  const { t } = useLanguage();

  const diseases = [
    { id: 'cold', label: t('cold'), icon: Thermometer },
    { id: 'digestive', label: t('digestive'), icon: Activity },
    { id: 'skin', label: t('skin'), icon: Droplet },
    { id: 'joints', label: t('joints'), icon: Bone },
    { id: 'headache', label: t('headache'), icon: Brain },
    { id: 'heart', label: t('heart'), icon: Heart },
    { id: 'liver', label: t('liver'), icon: Leaf },
    { id: 'kidneys', label: t('kidneys'), icon: Pill },
    { id: 'oncology', label: t('oncology'), icon: Shield },
    { id: 'nervous', label: t('nervous'), icon: Zap },
    { id: 'womensHealth', label: t('womensHealth'), icon: FemaleUser },
    { id: 'mensHealth', label: t('mensHealth'), icon: User },
    { id: 'forChildren', label: t('forChildren'), icon: Baby },
    { id: 'vision', label: t('vision'), icon: Eye },
    { id: 'hemorrhoids', label: t('hemorrhoids'), icon: CircleDot },
  ];

  return (
    <aside className="w-64 bg-white border-r-2 border-gray-200 p-4">
      <h3 className="text-red-600 mb-4">{t('diseases')}</h3>
      
      <div className="space-y-2">
        <button
          onClick={() => onSelectDisease(null)}
          className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
            !selectedDisease
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <Activity size={20} />
          <span>{t('allProducts')}</span>
        </button>

        {diseases.map((disease) => {
          const Icon = disease.icon;
          return (
            <button
              key={disease.id}
              onClick={() => onSelectDisease(disease.id)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                selectedDisease === disease.id
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Icon size={20} />
              <span>{disease.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
