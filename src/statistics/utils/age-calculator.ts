export const ageCalculator = (dob: Date) => {
    const today = new Date();
    const day = dob.getDate();
    const month = dob.getMonth();
    const year = dob.getFullYear();
    let age = today.getFullYear() - year;
    const m = today.getMonth() - month;
    if (m < 0 || (m === 0 && today.getDate() < day)){
        age--;
    }
    console.log(age);
    return age;
}