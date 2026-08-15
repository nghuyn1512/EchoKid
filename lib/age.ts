export function formatAgeMonths(ageMonths: number): string {
if (!Number.isInteger(ageMonths) || ageMonths < 0) {
return "Chưa rõ tuổi";
}
if (ageMonths < 24) {
return `${ageMonths} tháng`;
}

const years = Math.floor(ageMonths / 12);
const remainingMonths = ageMonths % 12;
if (remainingMonths === 0) {
return `${years} tuổi (${ageMonths} tháng)`;
}
return `${years} tuổi ${remainingMonths} tháng (${ageMonths} tháng)`;
}
export function splitAgeMonths(ageMonths: number) {
if (!Number.isInteger(ageMonths) || ageMonths < 0) {
return { years: 0, months: 0 };
}
return {
years: Math.floor(ageMonths / 12),
months: ageMonths % 12,
};
}
 
export function combineAgeMonths(years: number, months: number): number {
const safeYears = Number.isInteger(years) && years >= 0 ? years : 0;
const safeMonths = Number.isInteger(months) && months >= 0 ? months : 0;
return safeYears * 12 + safeMonths;
}