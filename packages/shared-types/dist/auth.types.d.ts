export declare enum Role {
    ADMIN = "ADMIN",
    DOCTOR = "DOCTOR"
}
export declare enum PlanType {
    BASIC = "BASIC",
    PRO = "PRO",
    ENTERPRISE = "ENTERPRISE"
}
export interface JwtPayload {
    sub: string;
    clinicId: string;
    role: Role;
    email: string;
    planType: PlanType;
}
export interface AuthUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}
export interface AuthClinic {
    id: string;
    name: string;
    slug: string;
    planType: PlanType;
}
export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
    clinic: AuthClinic;
    role: Role;
}
export interface ClinicOption {
    id: string;
    name: string;
    slug: string;
    role: Role;
}
export interface ClinicSelectionRequired {
    requiresClinicSelection: true;
    clinics: ClinicOption[];
    tempToken: string;
}
export type LoginResult = AuthResponse | ClinicSelectionRequired;
//# sourceMappingURL=auth.types.d.ts.map