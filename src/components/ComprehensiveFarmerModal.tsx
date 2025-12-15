import { X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FarmerCompleteData {
  farmer: {
    farmer_id: string;
    block_code: string;
    farmer_name: string;
    surveyor_id: string;
    village_code: string;
    district_code: string;
    farmer_mobile: string;
    farmer_category: string;
  };
  crop_registration: any;
  land_preparation: any;
  seed_selection: any;
  nutrient_management: any;
  weed_management: any;
  pest_management: any;
  irrigation: any;
  harvesting_management: any;
  crop_master: any;
  village: any;
  block: any;
  district: any;
}

interface ComprehensiveFarmerModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmerData: FarmerCompleteData | null;
}

export default function ComprehensiveFarmerModal({
  isOpen,
  onClose,
  farmerData,
}: ComprehensiveFarmerModalProps) {
  if (!isOpen || !farmerData) return null;

  const { farmer, crop_registration, land_preparation, seed_selection, nutrient_management, weed_management, pest_management, irrigation, harvesting_management, crop_master, village, block, district } = farmerData;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{farmer.farmer_name}</h2>
              <p className="text-sm text-gray-600 mt-1">Complete Farmer Information</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto px-6 py-6 space-y-6">
            <Section title="Farmer Details">
              <InfoRow label="Farmer ID" value={farmer.farmer_id} />
              <InfoRow label="Mobile" value={farmer.farmer_mobile} />
              <InfoRow label="Category" value={farmer.farmer_category} />
              <InfoRow label="Surveyor ID" value={farmer.surveyor_id} />
            </Section>

            <Section title="Location">
              <InfoRow label="Village" value={village?.village_name || "N/A"} />
              <InfoRow label="Village Code" value={village?.village_code || "N/A"} />
              <InfoRow label="Block" value={block?.block_name || "N/A"} />
              <InfoRow label="Block Code" value={block?.block_code || "N/A"} />
              <InfoRow label="District" value={district?.district_name || "N/A"} />
              <InfoRow label="District Code" value={district?.district_code || "N/A"} />
            </Section>

            {crop_master && (
              <Section title="Crop Information">
                <InfoRow label="Crop (English)" value={crop_master.crop_name_en} />
                <InfoRow label="Crop (Hindi)" value={crop_master.crop_name_hi} />
                <InfoRow label="Crop (Marathi)" value={crop_master.crop_name_mr} />
              </Section>
            )}

            {crop_registration && (
              <Section title="Crop Registration">
                <InfoRow label="Season" value={crop_registration.season} />
                <InfoRow label="Year" value={crop_registration.year} />
                <InfoRow label="Plot Area" value={`${crop_registration.plot_area} sq units`} />
              </Section>
            )}

            {land_preparation && (
              <Section title="Land Preparation">
                <InfoRow label="Ploughing Date" value={land_preparation.ploughing_date || "N/A"} />
                <InfoRow label="Harrow Date" value={land_preparation.harrow_date || "N/A"} />
                <InfoRow label="FYM Date" value={land_preparation.fym_date || "N/A"} />
                <InfoRow label="FYM Quantity" value={land_preparation.fym_quantity || "N/A"} />
              </Section>
            )}

            {seed_selection && (
              <Section title="Seed Selection">
                <InfoRow label="Variety Name" value={seed_selection.variety_name || "N/A"} />
                <InfoRow label="Duration" value={seed_selection.duration ? `${seed_selection.duration} days` : "N/A"} />
                <InfoRow label="Sowing Date" value={seed_selection.sowing_date || "N/A"} />
                <InfoRow label="Sowing Method" value={seed_selection.sowing_method || "N/A"} />
                <InfoRow label="Spacing" value={seed_selection.spacing_cm_squared || "N/A"} />
                <InfoRow label="Seed Rate" value={seed_selection.seed_rate_kg_per_plot ? `${seed_selection.seed_rate_kg_per_plot} kg` : "N/A"} />
              </Section>
            )}

            {nutrient_management && (
              <Section title="Nutrient Management">
                <InfoRow label="Urea Basal" value={nutrient_management.urea_basal_kg ? `${nutrient_management.urea_basal_kg} kg on ${nutrient_management.urea_basal_dt}` : "N/A"} />
                <InfoRow label="DAP" value={nutrient_management.dap_kg ? `${nutrient_management.dap_kg} kg on ${nutrient_management.dap_date}` : "N/A"} />
                <InfoRow label="SSP" value={nutrient_management.ssp_kg ? `${nutrient_management.ssp_kg} kg on ${nutrient_management.ssp_date}` : "N/A"} />
                <InfoRow label="MOP" value={nutrient_management.mop_kg ? `${nutrient_management.mop_kg} kg on ${nutrient_management.mop_date}` : "N/A"} />
                {nutrient_management.other_name && (
                  <InfoRow label={nutrient_management.other_name} value={`${nutrient_management.other_quantity_kg || 0} kg on ${nutrient_management.other_date}`} />
                )}
              </Section>
            )}

            {weed_management && (
              <Section title="Weed Management">
                <InfoRow label="Hand Weeding 1" value={weed_management.hand_weeding_date_1 || "N/A"} />
                <InfoRow label="Hand Weeding 2" value={weed_management.hand_weeding_date_2 || "N/A"} />
                <InfoRow label="Hoeing 1" value={weed_management.hoeing_date_1 || "N/A"} />
                <InfoRow label="Hoeing 2" value={weed_management.hoeing_date_2 || "N/A"} />
                {weed_management.post_herbicide_name_1 && (
                  <InfoRow label="Post Herbicide 1" value={`${weed_management.post_herbicide_name_1} - ${weed_management.post_herbicide_quantity_1 || 0} ${weed_management.post_herbicide_unit_1} on ${weed_management.post_herbicide_date_1}`} />
                )}
              </Section>
            )}

            {pest_management && pest_management.insecticide_spray && pest_management.insecticide_spray.length > 0 && (
              <Section title="Pest Management - Insecticide Sprays">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pest_management.insecticide_spray.map((spray: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{spray.date}</TableCell>
                        <TableCell>{spray.name}</TableCell>
                        <TableCell>{spray.quantity}</TableCell>
                        <TableCell>{spray.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Section>
            )}

            {irrigation && irrigation.irrigation_data && irrigation.irrigation_data.length > 0 && (
              <Section title="Irrigation Management">
                <InfoRow label="Method" value={irrigation.irrigation_method || "N/A"} />
                <InfoRow label="Total Count" value={irrigation.irrigation_count?.toString() || "0"} />
                <InfoRow label="Plastic Mulching" value={irrigation.plastic_mulching || "N/A"} />
                <InfoRow label="Crop Residue Mulching" value={irrigation.crop_residue_mulching || "N/A"} />

                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Irrigation Details</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Count</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {irrigation.irrigation_data.map((irr: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{irr.irrigation_count}</TableCell>
                          <TableCell>{irr.date || "N/A"}</TableCell>
                          <TableCell>
                            {irr.hours && irr.minutes ? `${irr.hours}h ${irr.minutes}m` : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Section>
            )}

            {harvesting_management && harvesting_management.harvesting_details && harvesting_management.harvesting_details.length > 0 && (
              <Section title="Harvesting Management">
                <InfoRow label="Total Harvests" value={harvesting_management.harvesting_count?.toString() || "0"} />

                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Harvest Details</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Count</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Production (kg)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {harvesting_management.harvesting_details.map((harvest: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{harvest.count}</TableCell>
                          <TableCell>{harvest.date}</TableCell>
                          <TableCell>{harvest.production_kg_per_plot}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h3 className="text-base font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start text-sm">
      <span className="text-gray-600 font-medium">{label}:</span>
      <span className="text-gray-900 text-right font-semibold max-w-[60%] break-words">{value}</span>
    </div>
  );
}