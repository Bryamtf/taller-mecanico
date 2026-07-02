export const passwordRules = {
  length: (value) => value.length >= 8,
  uppercase: (value) => /[A-Z]/.test(value),
  lowercase: (value) => /[a-z]/.test(value),
  number: (value) => /\d/.test(value),
};

export const isPasswordValid = (value = '') =>
  Object.values(passwordRules).every((rule) => rule(value));

export const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
