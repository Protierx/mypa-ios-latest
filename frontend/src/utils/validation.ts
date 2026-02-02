/**
 * Form Validation Utilities
 * Provides reusable validation functions for forms
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Validation patterns
export const patterns = {
  email: /^\S+@\S+\.\S+$/,
  password: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  username: /^[a-zA-Z0-9_-]{3,20}$/,
  phone: /^[+]?[(]?[0-9]{1,3}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/,
  url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
};

/**
 * Validate email
 */
export function validateEmail(email: string): ValidationError | null {
  if (!email || email.trim() === '') {
    return { field: 'email', message: 'Email is required' };
  }
  if (email.length > 254) {
    return { field: 'email', message: 'Email is too long' };
  }
  if (!patterns.email.test(email)) {
    return { field: 'email', message: 'Please enter a valid email' };
  }
  return null;
}

/**
 * Validate password
 */
export function validatePassword(password: string): ValidationError | null {
  if (!password || password.trim() === '') {
    return { field: 'password', message: 'Password is required' };
  }
  if (password.length < 8) {
    return { field: 'password', message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { field: 'password', message: 'Password must contain uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { field: 'password', message: 'Password must contain lowercase letter' };
  }
  if (!/\d/.test(password)) {
    return { field: 'password', message: 'Password must contain a number' };
  }
  if (!/[@$!%*?&]/.test(password)) {
    return { field: 'password', message: 'Password must contain special character (@$!%*?&)' };
  }
  return null;
}

/**
 * Validate password confirmation
 */
export function validatePasswordConfirmation(
  password: string,
  confirmation: string
): ValidationError | null {
  if (!confirmation || confirmation.trim() === '') {
    return { field: 'passwordConfirmation', message: 'Please confirm password' };
  }
  if (password !== confirmation) {
    return { field: 'passwordConfirmation', message: 'Passwords do not match' };
  }
  return null;
}

/**
 * Validate username
 */
export function validateUsername(username: string): ValidationError | null {
  if (!username || username.trim() === '') {
    return { field: 'username', message: 'Username is required' };
  }
  if (username.length < 3) {
    return { field: 'username', message: 'Username must be at least 3 characters' };
  }
  if (username.length > 20) {
    return { field: 'username', message: 'Username must not exceed 20 characters' };
  }
  if (!patterns.username.test(username)) {
    return { field: 'username', message: 'Username can only contain letters, numbers, _, -' };
  }
  return null;
}

/**
 * Validate required field
 */
export function validateRequired(value: string, fieldName: string): ValidationError | null {
  if (!value || value.trim() === '') {
    return { field: fieldName, message: `${fieldName} is required` };
  }
  return null;
}

/**
 * Validate minimum length
 */
export function validateMinLength(
  value: string,
  minLength: number,
  fieldName: string
): ValidationError | null {
  if (!value) {
    return null; // Use validateRequired for empty check
  }
  if (value.length < minLength) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least ${minLength} characters`,
    };
  }
  return null;
}

/**
 * Validate maximum length
 */
export function validateMaxLength(
  value: string,
  maxLength: number,
  fieldName: string
): ValidationError | null {
  if (!value) {
    return null;
  }
  if (value.length > maxLength) {
    return {
      field: fieldName,
      message: `${fieldName} must not exceed ${maxLength} characters`,
    };
  }
  return null;
}

/**
 * Validate task form
 */
export function validateTaskForm(data: {
  title?: string;
  category?: string;
  priority?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate title
  if (!data.title || data.title.trim() === '') {
    errors.push({ field: 'title', message: 'Task title is required' });
  } else if (data.title.length > 200) {
    errors.push({ field: 'title', message: 'Title must not exceed 200 characters' });
  }

  // Validate category
  if (!data.category || data.category.trim() === '') {
    errors.push({ field: 'category', message: 'Please select a category' });
  }

  // Validate priority
  if (!data.priority) {
    errors.push({ field: 'priority', message: 'Please select a priority' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate circle join code
 */
export function validateInviteCode(code: string): ValidationError | null {
  if (!code || code.trim() === '') {
    return { field: 'inviteCode', message: 'Invite code is required' };
  }
  const trimmed = code.trim().toUpperCase();
  if (trimmed.length < 4) {
    return { field: 'inviteCode', message: 'Invalid invite code' };
  }
  return null;
}

/**
 * Validate challenge data
 */
export function validateChallengeForm(data: {
  name?: string;
  category?: string;
  target?: number | string;
  days?: number | string;
}): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.name || data.name.trim() === '') {
    errors.push({ field: 'name', message: 'Challenge name is required' });
  } else if (data.name.length > 100) {
    errors.push({ field: 'name', message: 'Name must not exceed 100 characters' });
  }

  if (!data.category) {
    errors.push({ field: 'category', message: 'Please select a category' });
  }

  const target = Number(data.target);
  if (!data.target || isNaN(target) || target < 1) {
    errors.push({ field: 'target', message: 'Target must be a positive number' });
  }

  const days = Number(data.days);
  if (!data.days || isNaN(days) || days < 1) {
    errors.push({ field: 'days', message: 'Duration must be a positive number' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
