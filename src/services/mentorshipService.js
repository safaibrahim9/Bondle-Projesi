import api from './api';

export const getPrograms = async () => {
    return api.request('/mentorship/programs');
};

export const getProgramById = async (id) => {
    return api.request(`/mentorship/programs/${id}`);
};

export const applyToProgram = async (programId, applicationData) => {
    return api.request(`/mentorship/programs/${programId}/apply`, {
        method: 'POST',
        body: JSON.stringify(applicationData),
    });
};

export const getMyApplications = async () => {
    return api.request('/mentorship/my-applications');
};

// Admin
export const createProgram = async (programData) => {
    return api.request('/mentorship/programs', {
        method: 'POST',
        body: JSON.stringify(programData),
    });
};

export const deleteProgram = async (programId) => {
    return api.request(`/mentorship/programs/${programId}`, {
        method: 'DELETE',
    });
};

export const getProgramApplications = async (programId) => {
    return api.request(`/mentorship/programs/${programId}/applications`);
};

export const updateApplicationStatus = async (applicationId, status) => {
    return api.request(`/mentorship/applications/${applicationId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
    });
};

export const updateProgram = async (programId, programData) => {
    return api.request(`/mentorship/programs/${programId}`, {
        method: 'PUT',
        body: JSON.stringify(programData),
    });
};

export default {
    getPrograms,
    getProgramById,
    applyToProgram,
    getMyApplications,
    createProgram,
    deleteProgram,
    updateProgram,
    getProgramApplications,
    updateApplicationStatus,
};
