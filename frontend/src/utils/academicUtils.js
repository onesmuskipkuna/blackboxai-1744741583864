/**
 * Academic utility functions for handling class progression, academic years,
 * and related calculations
 */

// Class levels and their order
const PRIMARY_CLASSES = ['pg', 'pp1', 'pp2', 'grade1', 'grade2', 'grade3', 'grade4', 'grade5', 'grade6'];
const JUNIOR_CLASSES = ['grade7', 'grade8', 'grade9', 'grade10'];

/**
 * Get the next possible class(es) for promotion based on current class
 * @param {string} currentClass - The student's current class
 * @returns {Array} Array of possible next classes
 */
export const getNextClasses = (currentClass) => {
    if (!currentClass) return [];
    
    const normalizedClass = currentClass.toLowerCase();
    
    // Check in primary classes
    const primaryIndex = PRIMARY_CLASSES.indexOf(normalizedClass);
    if (primaryIndex !== -1) {
        if (primaryIndex === PRIMARY_CLASSES.length - 1) {
            // If current class is grade6, next class is grade7 (junior secondary)
            return [JUNIOR_CLASSES[0]];
        }
        return [PRIMARY_CLASSES[primaryIndex + 1]];
    }
    
    // Check in junior classes
    const juniorIndex = JUNIOR_CLASSES.indexOf(normalizedClass);
    if (juniorIndex !== -1 && juniorIndex < JUNIOR_CLASSES.length - 1) {
        return [JUNIOR_CLASSES[juniorIndex + 1]];
    }
    
    return [];
};

/**
 * Validate if the class progression is valid
 * @param {string} fromClass - Current class
 * @param {string} toClass - Target class for promotion
 * @returns {boolean} Whether the progression is valid
 */
export const isValidClassProgression = (fromClass, toClass) => {
    if (!fromClass || !toClass) return false;
    
    const normalizedFromClass = fromClass.toLowerCase();
    const normalizedToClass = toClass.toLowerCase();
    
    // Check primary to primary progression
    const fromPrimaryIndex = PRIMARY_CLASSES.indexOf(normalizedFromClass);
    const toPrimaryIndex = PRIMARY_CLASSES.indexOf(normalizedToClass);
    
    if (fromPrimaryIndex !== -1) {
        if (toPrimaryIndex !== -1) {
            return toPrimaryIndex > fromPrimaryIndex;
        }
        // Check primary to junior transition (only grade6 to grade7)
        return normalizedFromClass === 'grade6' && normalizedToClass === 'grade7';
    }
    
    // Check junior to junior progression
    const fromJuniorIndex = JUNIOR_CLASSES.indexOf(normalizedFromClass);
    const toJuniorIndex = JUNIOR_CLASSES.indexOf(normalizedToClass);
    
    if (fromJuniorIndex !== -1 && toJuniorIndex !== -1) {
        return toJuniorIndex > fromJuniorIndex;
    }
    
    return false;
};

/**
 * Generate the next academic year based on the current one
 * @param {string} currentYear - Current academic year in format "YYYY-YYYY"
 * @returns {string} Next academic year in format "YYYY-YYYY"
 */
export const getNextAcademicYear = (currentYear) => {
    if (!currentYear || !currentYear.match(/^\d{4}-\d{4}$/)) {
        const now = new Date();
        const year = now.getFullYear();
        return `${year}-${year + 1}`;
    }
    
    const [startYear] = currentYear.split('-').map(Number);
    return `${startYear + 1}-${startYear + 2}`;
};

/**
 * Validate academic year format and sequence
 * @param {string} academicYear - Academic year to validate
 * @returns {boolean} Whether the academic year is valid
 */
export const isValidAcademicYear = (academicYear) => {
    if (!academicYear || !academicYear.match(/^\d{4}-\d{4}$/)) {
        return false;
    }
    
    const [startYear, endYear] = academicYear.split('-').map(Number);
    return endYear === startYear + 1;
};

/**
 * Format class name for display
 * @param {string} className - Raw class name
 * @returns {string} Formatted class name
 */
export const formatClassName = (className) => {
    if (!className) return '';
    
    const normalized = className.toLowerCase();
    
    if (normalized === 'pg') return 'Play Group';
    if (normalized === 'pp1') return 'Pre-Primary 1';
    if (normalized === 'pp2') return 'Pre-Primary 2';
    
    // Format grade classes (grade1 -> Grade 1)
    if (normalized.startsWith('grade')) {
        const number = normalized.replace('grade', '');
        return `Grade ${number}`;
    }
    
    return className;
};

/**
 * Get school level (PRIMARY/JUNIOR) based on class
 * @param {string} className - Class name
 * @returns {string} School level
 */
export const getSchoolLevel = (className) => {
    if (!className) return '';
    
    const normalized = className.toLowerCase();
    if (PRIMARY_CLASSES.includes(normalized)) {
        return 'PRIMARY';
    }
    if (JUNIOR_CLASSES.includes(normalized)) {
        return 'JUNIOR';
    }
    return '';
};

/**
 * Format amount in currency format
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted amount
 */
export const formatAmount = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
};

/**
 * Format date in a readable format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

/**
 * Check if a student can be promoted
 * @param {Object} student - Student object
 * @returns {Object} Result with status and message
 */
export const canPromoteStudent = (student) => {
    if (!student) {
        return { 
            canPromote: false, 
            message: 'Invalid student data' 
        };
    }

    // Check if student is in the highest class
    const currentClass = student.current_class.toLowerCase();
    if (currentClass === JUNIOR_CLASSES[JUNIOR_CLASSES.length - 1]) {
        return { 
            canPromote: false, 
            message: 'Student is already in the highest class' 
        };
    }

    // Add any additional promotion criteria here
    // For example, checking if the student has completed the current academic year

    return { 
        canPromote: true, 
        message: 'Student is eligible for promotion' 
    };
};

export const ACADEMIC_TERMS = ['TERM_1', 'TERM_2', 'TERM_3'];

export const getCurrentTerm = () => {
    const month = new Date().getMonth() + 1; // JavaScript months are 0-based
    
    // Example term mapping (adjust according to your school calendar):
    // Term 1: January - April (1-4)
    // Term 2: May - August (5-8)
    // Term 3: September - December (9-12)
    
    if (month >= 1 && month <= 4) return 'TERM_1';
    if (month >= 5 && month <= 8) return 'TERM_2';
    return 'TERM_3';
};
