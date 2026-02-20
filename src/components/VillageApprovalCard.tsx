import { MapPin } from 'lucide-react';

interface UnapprovedVillage {
  village_profile_id: number;
  village_name: string;
  block_name: string;
  district_name: string;
  state_name: string;
  full_name: string;
  email: string;
  created_at: string;
  language_id: number;
}

interface VillageApprovalCardProps {
  village: UnapprovedVillage;
  onApprove: (village: UnapprovedVillage) => void;
  onReject: (village: UnapprovedVillage) => void;
  onViewDetails: (village: UnapprovedVillage) => void;
}

export const VillageApprovalCard = ({
  village,
  onApprove,
  onReject,
  onViewDetails,
}: VillageApprovalCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {village.village_name}
            </h3>
          </div>
          <div className="space-y-1 ml-7">
            <p className="text-sm text-gray-600">
              {village.block_name}, {village.district_name}
            </p>
            <p className="text-sm text-gray-600">{village.state_name}</p>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                Submitted by:{' '}
                <span className="font-medium text-gray-900">
                  {village.full_name}
                </span>
              </p>
              <p className="text-xs text-gray-500">{village.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                Submitted on {formatDate(village.created_at)}
              </p>
            </div>
          </div>
        </div>
        <div className="text-right ml-4">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            Pending Review
          </span>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onApprove(village)}
          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white py-2 px-4 rounded-lg font-medium hover:from-green-700 hover:to-emerald-600 transition-all"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => onReject(village)}
          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={() => onViewDetails(village)}
          className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );
};
