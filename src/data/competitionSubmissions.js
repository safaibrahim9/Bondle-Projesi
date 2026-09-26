// Competition join submissions storage
let submissions = [];
let nextId = 1;

// Submit a join request
export const submitJoinRequest = (competitionId, userId, formData) => {
    const submission = {
        id: nextId++,
        competitionId,
        userId,
        name: formData.name,
        surname: formData.surname,
        motivation: formData.motivation,
        submittedAt: new Date().toISOString(),
        status: 'pending', // pending, approved, rejected
        teamId: null // null until admin assigns to a team
    };

    submissions.push(submission);
    return submission;
};

// Get all submissions for a specific competition
export const getSubmissionsByCompetition = (competitionId) => {
    return submissions
        .filter(sub => sub.competitionId === competitionId)
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
};

// Get all submissions (for admin view)
export const getAllSubmissions = () => {
    return [...submissions].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
};

// Get submission by user and competition (to check if user already applied)
export const getUserSubmission = (userId, competitionId) => {
    return submissions.find(sub => sub.userId === userId && sub.competitionId === competitionId);
};

// Check if user has already applied
export const hasUserApplied = (userId, competitionId) => {
    return !!getUserSubmission(userId, competitionId);
};

// Admin functions (for future use)
export const updateSubmissionStatus = (submissionId, status) => {
    const submission = submissions.find(sub => sub.id === submissionId);
    if (submission) {
        submission.status = status;
        return submission;
    }
    return null;
};

export const assignToTeam = (submissionId, teamId) => {
    const submission = submissions.find(sub => sub.id === submissionId);
    if (submission) {
        submission.teamId = teamId;
        submission.status = 'approved';
        return submission;
    }
    return null;
};

export default {
    submitJoinRequest,
    getSubmissionsByCompetition,
    getAllSubmissions,
    getUserSubmission,
    hasUserApplied,
    updateSubmissionStatus,
    assignToTeam
};
