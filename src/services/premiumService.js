import api from './api';

export const getPlans = async () => {
    return api.request('/premium/plans');
};

export const getMyMembership = async () => {
    return api.request('/premium/my-membership');
};

export const subscribe = async (plan) => {
    return api.request(`/premium/subscribe/${plan}`, {
        method: 'POST',
    });
};

export default {
    getPlans,
    getMyMembership,
    subscribe,
};
