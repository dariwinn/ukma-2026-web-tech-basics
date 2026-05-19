const students = [
  { name: "Бурдейна Інна", age: 18, grades: [61, 67, 69], group: "КН-3" },
  { name: "Круткевич Іван", age: 19, grades: [65, 76, 72], group: "КН-4" },
  { name: "Сошко Марія", age: 18, grades: [95, 88, 92], group: "КН-3" },
  { name: "Мартинов Богдан", age: 19, grades: [67, 67, 88], group: "КН-1" },
  { name: "Марков Антон", age: 18, grades: [91, 92, 94], group: "КН-1" },
  { name: "Кравець Денис", age: 20, grades: [60, 58, 62], group: "КН-3" },
  { name: "Костюк Поліна", age: 19, grades: [88, 95, 91], group: "КН-1" },
  { name: "Шегинський Андрій", age: 19, grades: [75, 80, 85], group: "КН-1" },
  { name: "Соловар Олексій", age: 19, grades: [60, 56, 66], group: "КН-1" },
  { name: "Муратова Саша", age: 17, grades: [61, 100, 70], group: "КН-2" }
];

const getAverageGrade = (grades) => {
  return grades.length === 0 ? 0 : grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
};

const getNames = (studentsArray) => {
  return studentsArray.map(student => student.name);
};

const getByGroup = (studentsArray, targetGroup) => {
  return studentsArray.filter(student => student.group === targetGroup);
};

const topStudents = (studentsArray, n = 3) => {
  return [...studentsArray]
    .sort((studentA, studentB) => getAverageGrade(studentB.grades) - getAverageGrade(studentA.grades))
    .slice(0, n);
};

const groupBy = (studentsArray, key) => {
  return studentsArray.reduce((accumulator, student) => {
    const groupKeyValue = student[key];
    if (!accumulator[groupKeyValue]) {
      accumulator[groupKeyValue] = [];
    }
    accumulator[groupKeyValue].push(student);
    return accumulator;
  }, {});
};

const addGrade = (studentsArray, studentName, newGrade) => {
  return studentsArray.map(student => {
    if (student.name === studentName) {
      return {
        ...student,
        grades: [...student.grades, newGrade]
      };
    }
    return student;
  });
};

console.log("1. Масив імен студентів");
console.log(getNames(students));

console.log("2. Фільтрація за групою 'КН-3'");
console.log(getByGroup(students, "КН-3"));

console.log("3. ТОП-3 студенти за середнім балом");
console.table(
  topStudents(students, 3).map(s => ({
    "Ім'я": s.name,
    "Сер.Бал": getAverageGrade(s.grades).toFixed(1)
  }))
);

console.log("4. Групування за полем 'group'");
console.log(groupBy(students, "group"));

console.log("5. Додавання оцінки (Перевірка на імутабельність)");
const updatedStudents = addGrade(students, "С", 100);

console.log("Змінений масив (Муратова Олександра має отримати 100):");
console.log(updatedStudents.find(s => s.name === "Муратова Саша"));

console.log("Оригінальний масив (має залишитися БЕЗ змін):");
console.log(students.find(s => s.name === "Муратова Саша"));