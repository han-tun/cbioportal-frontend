import { Patient, ClinicalData } from 'cbioportal-ts-api-client';
import { PatientSurvival } from '../../shared/model/PatientSurvival';

export function getPatientSurvivals(
    survivalClinicalDataGroupByUniquePatientKey: any,
    targetUniquePatientKeys: string[],
    statusAttributeId: string,
    monthsAttributeId: string,
    statusFilter: (s: string) => boolean
): PatientSurvival[] {
    if (targetUniquePatientKeys) {
        return targetUniquePatientKeys.reduce(
            (patientSurvivals: PatientSurvival[], uniquePatientKey: string) => {
                const clinicalData: ClinicalData[] =
                    survivalClinicalDataGroupByUniquePatientKey[
                        uniquePatientKey
                    ];
                if (clinicalData) {
                    const statusClinicalData:
                        | ClinicalData
                        | undefined = clinicalData.find(
                        c => c.clinicalAttributeId === statusAttributeId
                    );
                    const monthsClinicalData:
                        | ClinicalData
                        | undefined = clinicalData.find(
                        c => c.clinicalAttributeId === monthsAttributeId
                    );
                    if (
                        statusClinicalData &&
                        monthsClinicalData &&
                        statusClinicalData.value != 'NA' &&
                        monthsClinicalData.value != 'NA' &&
                        !Number.isNaN(Number(monthsClinicalData.value))
                    ) {
                        patientSurvivals.push({
                            uniquePatientKey,
                            patientId: clinicalData[0].patientId,
                            studyId: clinicalData[0].studyId,
                            status: statusFilter(statusClinicalData.value),
                            months: parseFloat(monthsClinicalData.value),
                        });
                    }
                }
                return patientSurvivals;
            },
            []
        );
    } else {
        return [];
    }
}
