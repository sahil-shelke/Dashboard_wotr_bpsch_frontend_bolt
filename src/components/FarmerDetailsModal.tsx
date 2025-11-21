import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface CropRegistration {
  crop_id: string;
  plot_area: string;
  season: string;
  year: string;
}

interface FarmerData {
  farmer_id: string;
  farmer_name: string;
  farmer_mobile: string;
  surveyor_id: string;
  farmer_category: string;
  block_code: string;
  block_name: string;
  district_code: string;
  district_name: string;
  village_code: string;
  village_name: string;
  crop_registrations: CropRegistration[];
}

interface FarmerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmerData: FarmerData | null;
}

export default function FarmerDetailsModal({
  isOpen,
  onClose,
  farmerData,
}: FarmerDetailsModalProps) {
  if (!farmerData) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl">{farmerData.farmer_name}</SheetTitle>
          <SheetDescription>Farmer Details</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Basic Information
            </h3>
            <div className="space-y-2">
              <InfoRow label="Farmer ID" value={farmerData.farmer_id} />
              <InfoRow label="Mobile" value={farmerData.farmer_mobile} />
              <InfoRow label="Category" value={farmerData.farmer_category} />
              <InfoRow label="Surveyor ID" value={farmerData.surveyor_id} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Location Details
            </h3>
            <div className="space-y-2">
              <InfoRow label="Village" value={farmerData.village_name} />
              <InfoRow label="Village Code" value={farmerData.village_code} />
              <InfoRow label="Block" value={farmerData.block_name} />
              <InfoRow label="Block Code" value={farmerData.block_code} />
              <InfoRow label="District" value={farmerData.district_name} />
              <InfoRow label="District Code" value={farmerData.district_code} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Crop Registrations
            </h3>
            {farmerData.crop_registrations.length === 0 ? (
              <p className="text-sm text-gray-500">No crop registrations</p>
            ) : (
              <div className="space-y-3">
                {farmerData.crop_registrations.map((crop, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-3 space-y-1.5"
                  >
                    <InfoRow label="Crop ID" value={crop.crop_id} />
                    <InfoRow label="Plot Area" value={`${crop.plot_area} sq units`} />
                    <InfoRow label="Season" value={crop.season} />
                    <InfoRow label="Year" value={crop.year} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start text-sm">
      <span className="text-gray-600 font-medium">{label}:</span>
      <span className="text-gray-900 text-right font-semibold">{value}</span>
    </div>
  );
}
