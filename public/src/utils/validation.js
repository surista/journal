// Input Validation Utilities
// Provides comprehensive validation for user inputs to prevent security issues

/**
 * Validates a practice session object
 * @param {Object} session - The session object to validate
 * @returns {Object} Validated and sanitized session object
 * @throws {Error} If validation fails
 */
export function validatePracticeSession(session) {
    if (!session || typeof session !== 'object') {
        throw new Error('Invalid session object');
    }

    const validated = {};

    // Required fields
    if (!session.date) {
        throw new Error('Session date is required');
    }
    validated.date = validateDate(session.date);

    if (typeof session.duration !== 'number' || session.duration < 0) {
        throw new Error('Invalid session duration');
    }
    validated.duration = Math.floor(session.duration);

    // Optional fields with validation
    if (session.name) {
        validated.name = validateString(session.name, 1, 200);
    }

    if (session.practiceArea) {
        validated.practiceArea = validateString(session.practiceArea, 1, 100);
    }

    if (session.notes) {
        validated.notes = validateString(session.notes, 0, 5000);
    }

    if (session.bpm) {
        validated.bpm = validateNumber(session.bpm, 20, 300);
    }

    if (session.key) {
        validated.key = validateMusicKey(session.key);
    }

    if (session.audioFile) {
        validated.audioFile = validateString(session.audioFile, 1, 255);
    }

    if (session.youtubeUrl) {
        validated.youtubeUrl = validateYouTubeUrl(session.youtubeUrl);
    }

    if (session.youtubeTitle) {
        validated.youtubeTitle = validateString(session.youtubeTitle, 1, 200);
    }

    // Arrays
    if (session.techniques && Array.isArray(session.techniques)) {
        validated.techniques = session.techniques
            .filter((t) => typeof t === 'string')
            .map((t) => validateString(t, 1, 50))
            .slice(0, 20); // Limit to 20 techniques
    }

    // Numeric fields
    if (session.tempoPercentage) {
        validated.tempoPercentage = validateNumber(session.tempoPercentage, 25, 200);
    }

    if (session.pitchShift) {
        validated.pitchShift = validateNumber(session.pitchShift, -12, 12);
    }

    return validated;
}

/**
 * Validates a goal object
 * @param {Object} goal - The goal object to validate
 * @returns {Object} Validated goal object
 * @throws {Error} If validation fails
 */
export function validateGoal(goal) {
    if (!goal || typeof goal !== 'object') {
        throw new Error('Invalid goal object');
    }

    const validated = {};

    // Required fields
    if (!goal.title) {
        throw new Error('Goal title is required');
    }
    validated.title = validateString(goal.title, 1, 200);

    if (!goal.type || !['practice', 'technique', 'repertoire', 'custom'].includes(goal.type)) {
        throw new Error('Invalid goal type');
    }
    validated.type = goal.type;

    // Optional fields
    if (goal.description) {
        validated.description = validateString(goal.description, 0, 1000);
    }

    if (goal.targetValue) {
        validated.targetValue = validateNumber(goal.targetValue, 0, 10000);
    }

    if (goal.currentValue) {
        validated.currentValue = validateNumber(goal.currentValue, 0, 10000);
    }

    if (goal.deadline) {
        validated.deadline = validateDate(goal.deadline);
    }

    validated.priority = validateNumber(goal.priority || 1, 1, 3);
    validated.completed = !!goal.completed;

    return validated;
}

/**
 * Validates a string input
 * @param {string} str - The string to validate
 * @param {number} minLength - Minimum allowed length
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Trimmed and validated string
 * @throws {Error} If validation fails
 */
export function validateString(str, minLength = 0, maxLength = 1000) {
    if (typeof str !== 'string') {
        throw new Error('Input must be a string');
    }

    const trimmed = str.trim();

    if (trimmed.length < minLength) {
        throw new Error(`String must be at least ${minLength} characters`);
    }

    if (trimmed.length > maxLength) {
        throw new Error(`String must not exceed ${maxLength} characters`);
    }

    // Check for null bytes
    if (trimmed.includes('\0')) {
        throw new Error('String contains invalid characters');
    }

    return trimmed;
}

/**
 * Validates a number input
 * @param {number} num - The number to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Validated number
 * @throws {Error} If validation fails
 */
export function validateNumber(num, min = -Infinity, max = Infinity) {
    const parsed = Number(num);

    if (isNaN(parsed)) {
        throw new Error('Invalid number');
    }

    if (parsed < min || parsed > max) {
        throw new Error(`Number must be between ${min} and ${max}`);
    }

    return parsed;
}

/**
 * Validates a date input
 * @param {string|Date} date - The date to validate
 * @returns {string} ISO date string
 * @throws {Error} If validation fails
 */
export function validateDate(date) {
    const parsed = new Date(date);

    if (isNaN(parsed.getTime())) {
        throw new Error('Invalid date');
    }

    // Check if date is reasonable (not too far in past or future)
    const now = new Date();
    const yearAgo = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());
    const yearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    if (parsed < yearAgo || parsed > yearFromNow) {
        throw new Error('Date is out of acceptable range');
    }

    return parsed.toISOString();
}

/**
 * Validates a music key
 * @param {string} key - The musical key to validate
 * @returns {string} Validated key
 * @throws {Error} If validation fails
 */
export function validateMusicKey(key) {
    const validKeys = [
        'C',
        'C#',
        'Db',
        'D',
        'D#',
        'Eb',
        'E',
        'F',
        'F#',
        'Gb',
        'G',
        'G#',
        'Ab',
        'A',
        'A#',
        'Bb',
        'B',
        'Cm',
        'C#m',
        'Dbm',
        'Dm',
        'D#m',
        'Ebm',
        'Em',
        'Fm',
        'F#m',
        'Gbm',
        'Gm',
        'G#m',
        'Abm',
        'Am',
        'A#m',
        'Bbm',
        'Bm'
    ];

    if (!validKeys.includes(key)) {
        throw new Error('Invalid musical key');
    }

    return key;
}

/**
 * Validates a YouTube URL
 * @param {string} url - The URL to validate
 * @returns {string} Validated URL
 * @throws {Error} If validation fails
 */
export function validateYouTubeUrl(url) {
    if (typeof url !== 'string') {
        throw new Error('URL must be a string');
    }

    try {
        const parsed = new URL(url);

        // Only allow YouTube domains
        const validDomains = ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'];
        if (!validDomains.includes(parsed.hostname)) {
            throw new Error('Invalid YouTube URL');
        }

        // Check for video ID
        let videoId = null;
        if (parsed.hostname === 'youtu.be') {
            videoId = parsed.pathname.slice(1);
        } else {
            videoId = parsed.searchParams.get('v');
        }

        if (!videoId || !videoId.match(/^[a-zA-Z0-9_-]{11}$/)) {
            throw new Error('Invalid YouTube video ID');
        }

        return parsed.href;
    } catch (e) {
        throw new Error('Invalid YouTube URL format');
    }
}

/**
 * Validates file size
 * @param {number} size - File size in bytes
 * @param {number} maxSize - Maximum allowed size in bytes
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
export function validateFileSize(size, maxSize = 20 * 1024 * 1024) {
    // Default 20MB
    if (typeof size !== 'number' || size < 0) {
        throw new Error('Invalid file size');
    }

    if (size > maxSize) {
        throw new Error(`File size exceeds maximum of ${maxSize / (1024 * 1024)}MB`);
    }

    return true;
}

/**
 * Validates an email address
 * @param {string} email - The email to validate
 * @returns {string} Validated email
 * @throws {Error} If validation fails
 */
export function validateEmail(email) {
    if (typeof email !== 'string') {
        throw new Error('Email must be a string');
    }

    const trimmed = email.trim().toLowerCase();

    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
        throw new Error('Invalid email format');
    }

    if (trimmed.length > 254) {
        throw new Error('Email address too long');
    }

    return trimmed;
}

/**
 * Validates a repertoire song object
 * @param {Object} song - The song object to validate
 * @returns {Object} Validated song object
 * @throws {Error} If validation fails
 */
export function validateRepertoireSong(song) {
    if (!song || typeof song !== 'object') {
        throw new Error('Invalid song object');
    }

    const validated = {};

    // Required fields
    if (!song.title) {
        throw new Error('Song title is required');
    }
    validated.title = validateString(song.title, 1, 200);

    // Optional fields
    if (song.artist) {
        validated.artist = validateString(song.artist, 0, 200);
    }

    if (song.genre) {
        validated.genre = validateString(song.genre, 0, 50);
    }

    if (song.difficulty) {
        const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
        if (!validDifficulties.includes(song.difficulty)) {
            throw new Error('Invalid difficulty level');
        }
        validated.difficulty = song.difficulty;
    }

    if (song.status) {
        const validStatuses = ['learning', 'practicing', 'mastered', 'on-hold'];
        if (!validStatuses.includes(song.status)) {
            throw new Error('Invalid song status');
        }
        validated.status = song.status;
    }

    if (song.notes) {
        validated.notes = validateString(song.notes, 0, 1000);
    }

    if (song.videoLink) {
        validated.videoLink = validateYouTubeUrl(song.videoLink);
    }

    if (song.lastPracticed) {
        validated.lastPracticed = validateDate(song.lastPracticed);
    }

    if (song.targetBPM) {
        validated.targetBPM = validateNumber(song.targetBPM, 20, 300);
    }

    if (song.currentBPM) {
        validated.currentBPM = validateNumber(song.currentBPM, 20, 300);
    }

    return validated;
}
