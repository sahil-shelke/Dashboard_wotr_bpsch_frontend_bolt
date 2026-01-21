export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'regional_manager' | 'project_manager' | 'fpc_user' | 'agribusiness_officer';
  region?: string;
  isActive: boolean;
  createdAt: string;
}

export interface FPCRegistrationRequest {
  id: string;
  state: string;
  district: string;
  fpcName: string;
  selectedBODMember: BODMember;
  projectManager: ProjectManagerDetails;
  officeInfo: FPOOfficeInfo;
  registrationDocuments: RegistrationDocuments;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string;
  submittedAt: string;
  approvals: Approval[];
  createdBy: string;
}

export interface BODMember {
  name: string;
  email: string;
  phone: string;
  designation: string;
  experience: string;
}

export interface ProjectManagerDetails {
  name: string;
  email: string;
  phone: string;
  qualification: string;
  experience: string;
}

export interface FPOOfficeInfo {
  village: string;
  block: string;
  address: string;
  pincode: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
}

export interface RegistrationDocuments {
  fpcRegistrationNumber: string;
  pan: string;
  tan: string;
  gst: string;
  registrationCertificate?: File;
  panCard?: File;
  tanDocument?: File;
  gstCertificate?: File;
}

export interface Approval {
  id: string;
  requestId: string;
  approvedBy: string;
  approverName: string;
  approverRole: string;
  status: 'approved' | 'rejected';
  comments?: string;
  approvedAt: string;
}

export interface FPC {
  id: string;
  name: string;
  state: string;
  district: string;
  region: string;
  status: 'active' | 'inactive' | 'pending_setup';
  projectManagerId: string;
  registrationNumber: string;
  createdAt: string;
  profileCompleted: boolean;
}