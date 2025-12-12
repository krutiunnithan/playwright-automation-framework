export enum UserProfiles {
  CASE_MANAGER = 'casemanager',
  SYSTEM_ADMIN = 'systemadmin',
  ACCOMMODATIONS_MANAGER = 'accommodationsmanager',
}

export function getAllUserProfiles(): string[] {
  return Object.values(UserProfiles);
}