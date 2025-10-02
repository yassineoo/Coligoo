export const dateCalculator = (date: string): Date => {
  const today = new Date();
  const birthDate = date.split('/');
  const [day, month, year] = birthDate;
  const dateObject = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    0,
    0,
    0,
    0,
  );
  return dateObject;
};
