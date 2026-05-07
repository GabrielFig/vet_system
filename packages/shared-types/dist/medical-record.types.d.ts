export interface MedicalNoteSummary {
    id: string;
    title: string;
    content: string;
    attachmentUrl: string | null;
    authorId: string;
    clinicId: string;
    clinicName?: string;
    createdAt: string;
    updatedAt: string;
}
export interface PrescriptionSummary {
    id: string;
    diagnosis: string;
    medications: string;
    instructions: string;
    validUntil: string | null;
    doctorId: string;
    clinicId: string;
    createdAt: string;
}
export interface VaccinationSummary {
    id: string;
    vaccineName: string;
    batch: string | null;
    appliedAt: string;
    nextDose: string | null;
    appliedBy: string;
    clinicId: string;
    createdAt: string;
}
export interface ConsultationSummary {
    id: string;
    reason: string;
    clinicId: string;
    clinicName?: string;
    doctorId: string;
    createdAt: string;
    note: MedicalNoteSummary | null;
    prescriptions: PrescriptionSummary[];
    vaccinations: VaccinationSummary[];
}
export interface MedicalRecordDetail {
    id: string;
    petId: string;
    publicUuid: string;
    isPublic: boolean;
    consultations: ConsultationSummary[];
}
//# sourceMappingURL=medical-record.types.d.ts.map