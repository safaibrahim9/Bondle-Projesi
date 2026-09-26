import api from './api';

export const getCompetitions = async () => {
    return api.request('/competitions');
};

export const getCompetitionById = async (id) => {
    return api.request(`/competitions/${id}`);
};

export const registerForCompetition = async (id) => {
    return api.request(`/competitions/${id}/register`, {
        method: 'POST',
    });
};

export default {
    getCompetitions,
    getCompetitionById,
    registerForCompetition,
};
