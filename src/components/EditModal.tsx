import React, { useState } from 'react';
import { X, Users, UserPlus, FileCheck, Heart, DollarSign, FileText, BookOpen } from 'lucide-react';
import ShareholdersEditTab from './EditTabs/ShareholdersEditTab';
import StaffEditTab from './EditTabs/StaffEditTab';
import ComplianceEditTab from './EditTabs/ComplianceEditTab';
import DonorEditTab from './EditTabs/DonorEditTab';
import FinancialEditTab from './EditTabs/FinancialEditTab';
import LicenseEditTab from './EditTabs/LicenseEditTab';
import TrainingEditTab from './EditTabs/TrainingEditTab';
import FPOEditTab from './EditTabs/FPOEditTab';
import FacilitiesEditTab from './EditTabs/FacilityEditTab';
import BODEditTab from './EditTabs/BODEditTab';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  fpoId: number;
  fpoName: string;
}

type TabType = 'fpo' | 'bod' | 'shareholders' | 'staff' | 'compliance' | 'donors' | 'financial' | 'licenses' | 'trainings' | 'facilities';

const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, fpoId, fpoName }) => {
  const [activeTab, setActiveTab] = useState<TabType>('fpo');

  if (!isOpen) return null;

  const tabs = [
    { id: 'fpo' as TabType, label: 'FPO', icon: Users },
    { id: 'bod' as TabType, label: 'BOD', icon: Users },
    { id: 'shareholders' as TabType, label: 'Shareholders', icon: Users },
    { id: 'staff' as TabType, label: 'Staff', icon: UserPlus },
    { id: 'compliance' as TabType, label: 'Compliance', icon: FileCheck },
    { id: 'donors' as TabType, label: 'Donors', icon: Heart },
    { id: 'financial' as TabType, label: 'Financial', icon: DollarSign },
    { id: 'licenses' as TabType, label: 'Licenses', icon: FileText },
    { id: 'trainings' as TabType, label: 'Trainings', icon: BookOpen },
    { id: 'facilities' as TabType, label: 'Facilities', icon: Users },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit FPC Details</h2>
            <p className="text-sm text-gray-600 mt-1">{fpoName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex-shrink-0">
          <div className="flex space-x-1 min-w-max px-6 h-12">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 h-full text-sm font-medium border-b-2 transition-colors flex items-center whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'fpo' && <FPOEditTab fpoId={fpoId} />}
          {activeTab === 'bod' && <BODEditTab fpoId={fpoId} />}
          {activeTab === 'shareholders' && <ShareholdersEditTab fpoId={fpoId} />}
          {activeTab === 'staff' && <StaffEditTab fpoId={fpoId} />}
          {activeTab === 'compliance' && <ComplianceEditTab fpoId={fpoId} />}
          {activeTab === 'donors' && <DonorEditTab fpoId={fpoId} />}
          {activeTab === 'financial' && <FinancialEditTab fpoId={fpoId} />}
          {activeTab === 'licenses' && <LicenseEditTab fpoId={fpoId} />}
          {activeTab === 'trainings' && <TrainingEditTab fpoId={fpoId} />}
          {activeTab === 'facilities' && <FacilitiesEditTab fpoId={fpoId} />}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
