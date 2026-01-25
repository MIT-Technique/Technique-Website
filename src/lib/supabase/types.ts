export type UserRole = 'admin' | 'staph' | 'club' | 'living_group' | 'student';
export type AuthProvider = 'mit_sso' | 'supabase_auth';
export type ApprovalStatus = 'pending' | 'approved' | 'denied';
export type LivingGroupStatus = 'active' | 'disabled' | 'pending';
export type PromotionRequestType = 'staph_request' | 'photographer_request';
export type RequestStatus = 'pending' | 'approved' | 'denied';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_staph: boolean;
  is_living_group_leader: boolean;
  first_name: string | null;
  last_name: string | null;
  major: string | null;
  second_major: string | null;
  quote: string | null;
  achievements: string | null;
  school_year: number | null;
  auth_provider: AuthProvider;
  supabase_auth_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Club {
  id: string;
  user_id: string;
  club_id: string;
  name: string;
  description: string | null;
  member_list: string | null;
  candid_image_1: string | null;
  candid_image_2: string | null;
  candid_image_3: string | null;
  approval_status: ApprovalStatus;
  approval_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  document_links: string | null;
  document_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type LivingGroupType = 'dorm' | 'fsilg';
export type LivingGroupMembershipStatus = 'pending' | 'active' | 'removed';

export interface LivingGroup {
  id: string;
  user_id: string;
  name: string;
  status: LivingGroupStatus;
  living_group_type: LivingGroupType;
  has_leader: boolean;
  promoted_by: string | null;
  promoted_at: string | null;
  disabled_by: string | null;
  disabled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PhotoshootTime {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  living_group_id: string | null;
  booked_at: string | null;
  booked_by: string | null;
  location: string | null;
  cancellation_requested: boolean;
  cancellation_request_reason: string | null;
  cancellation_approved: boolean | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  created_by: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromotionRequest {
  id: string;
  user_id: string;
  request_type: PromotionRequestType;
  status: RequestStatus;
  request_reason: string | null;
  living_group_name: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FormSetting {
  id: string;
  form_name: string;
  is_frozen: boolean;
  frozen_by: string | null;
  frozen_at: string | null;
  unfrozen_by: string | null;
  unfrozen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  access_token: string | null;
  expires_at: string;
  code_verifier: string | null;
  state: string | null;
  created_at: string;
  updated_at: string;
}

// Extended types with relations
export interface UserWithClub extends User {
  club?: Club;
}

export interface UserWithLivingGroup extends User {
  living_group?: LivingGroup;
}

export interface PhotoshootTimeWithLivingGroup extends PhotoshootTime {
  living_group?: LivingGroup & {
    user?: User;
  };
}

export interface PromotionRequestWithUser extends PromotionRequest {
  user?: User;
}

// Club membership types
export type ClubMemberRole = 'member' | 'leader';

export interface ClubMembership {
  id: string;
  club_id: string;
  user_id: string;
  role: ClubMemberRole;
  joined_at: string;
}

export interface ClubJoinRequest {
  id: string;
  club_id: string;
  user_id: string;
  status: RequestStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface ClubLeaderRequest {
  id: string;
  club_id: string;
  user_id: string;
  requested_by: string;
  status: RequestStatus;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface ClubManualMember {
  id: string;
  club_id: string;
  name: string;
  added_at: string;
}

// Extended club membership types with relations
export interface ClubMembershipWithUser extends ClubMembership {
  user?: Pick<User, 'id' | 'email' | 'first_name' | 'last_name'>;
}

export interface ClubMembershipWithClub extends ClubMembership {
  club?: Club;
}

export interface ClubJoinRequestWithUser extends ClubJoinRequest {
  user?: Pick<User, 'id' | 'email' | 'first_name' | 'last_name'>;
}

export interface ClubJoinRequestWithClub extends ClubJoinRequest {
  club?: Club;
}

export interface ClubLeaderRequestWithDetails extends ClubLeaderRequest {
  user?: Pick<User, 'id' | 'email' | 'first_name' | 'last_name'>;
  club?: Club;
  requester?: Pick<User, 'id' | 'email' | 'first_name' | 'last_name'>;
}

// Living group section and membership types
export interface DormSection {
  id: string;
  dorm_name: string;
  section_name: string;
  display_order: number;
  created_at: string;
}

export interface LivingGroupMembership {
  id: string;
  living_group_id: string;
  user_id: string;
  section_id: string | null;
  membership_type: LivingGroupType;
  status: LivingGroupMembershipStatus;
  joined_at: string;
  approved_by: string | null;
  approved_at: string | null;
}

export interface SectionExpectedCount {
  id: string;
  living_group_id: string;
  section_id: string | null;
  expected_count: number;
  updated_at: string;
  updated_by: string | null;
}

// Extended living group types with relations
export interface LivingGroupMembershipWithUser extends LivingGroupMembership {
  user?: Pick<User, 'id' | 'email' | 'first_name' | 'last_name'>;
  section?: DormSection;
}

export interface LivingGroupMembershipWithDetails extends LivingGroupMembership {
  user?: Pick<User, 'id' | 'email' | 'first_name' | 'last_name'>;
  section?: DormSection;
  living_group?: LivingGroup;
}

export interface LivingGroupWithMemberCount extends LivingGroup {
  member_count?: number;
  expected_count?: number;
}

export interface SectionWithCounts extends DormSection {
  member_count: number;
  expected_count: number;
}

// Photographer permission types
export interface PhotographerPermission {
  id: string;
  user_id: string;
  approved_by: string | null;
  approved_at: string | null;
  is_active: boolean;
  revoked_by: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PhotographerPermissionWithUser extends PhotographerPermission {
  user?: Pick<User, 'id' | 'email' | 'first_name' | 'last_name'>;
  approver?: Pick<User, 'id' | 'email' | 'first_name' | 'last_name'>;
}

// Time proposal types (bidirectional scheduling)
export type TimeProposalStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface TimeProposal {
  id: string;
  living_group_id: string;
  proposed_by: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  notes: string | null;
  status: TimeProposalStatus;
  accepted_by: string | null;
  accepted_at: string | null;
  declined_by: string | null;
  declined_at: string | null;
  decline_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimeProposalWithDetails extends TimeProposal {
  living_group?: LivingGroup;
  proposer?: Pick<User, 'id' | 'email' | 'first_name' | 'last_name'>;
  accepter?: Pick<User, 'id' | 'email' | 'first_name' | 'last_name'>;
}
