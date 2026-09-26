export enum UserRole {
    ADMIN = 'admin',
    PREMIUM_USER = 'premium_user',
    CLUB_PRESIDENT = 'club_president',
    CAMPUS_AMBASSADOR = 'campus_ambassador',
    MENTOR = 'mentor',
    USER = 'user',
}

export enum EventType {
    STANDARD = 'standard',
    CIRCLE = 'circle',
}

export enum PaymentType {
    FREE = 'free',
    PAID = 'paid',
}

export enum EventStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    CANCELLED = 'cancelled',
}

export enum PaymentStatus {
    PENDING = 'pending',
    VERIFIED = 'verified',
    REJECTED = 'rejected',
}

export enum MatchType {
    FIRST = 'first',
    SECOND = 'second',
}

export enum MatchStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
}

export enum MeetingStatus {
    PENDING = 'pending',
    SCHEDULED = 'scheduled',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    REJECTED = 'rejected',
}

export enum TransactionType {
    EVENT_REGISTRATION = 'event_registration',
    NETWORKING_MATCH = 'networking_match',
    WEEKLY_RESET = 'weekly_reset',
    MANUAL_ADJUSTMENT = 'manual_adjustment',
    PREMIUM_REWARD = 'premium_reward',
}

export enum FeedbackType {
    EVENT = 'event',
    GENERAL = 'general',
    NETWORKING = 'networking',
}

export enum ClubMemberRole {
    PRESIDENT = 'president',
    ADMIN = 'admin',
    MEMBER = 'member',
}
