export const PASSWORD_RULES = [
  { id: "length", label: "6+ characters", test: (p: string) => p.length >= 6 },
  { id: "lower", label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { id: "upper", label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { id: "digit", label: "A digit", test: (p: string) => /\d/.test(p) },
  { id: "special", label: "Special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

export function passwordChecks(p: string) {
  return PASSWORD_RULES.map((r) => ({ id: r.id, label: r.label, met: r.test(p) }));
}

export function isPasswordValid(p: string) {
  return PASSWORD_RULES.every((r) => r.test(p));
}
