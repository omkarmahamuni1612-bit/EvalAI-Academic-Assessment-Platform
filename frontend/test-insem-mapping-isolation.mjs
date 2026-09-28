import assert from "node:assert";
import {
  inSemEnrolledStudents,
  inSemSubmissions,
  mapAnswerSheetToStudent,
  getInSemSubmissions,
  persistInSemState
} from "./src/data/inSemData.js";

console.log("============================================================");
console.log("RUNNING IN-SEM MAPPING & SECTION 03 ISOLATION SPECIFICATION TEST");
console.log("============================================================");

// Step 1: Initial state check - clear any submissions
inSemSubmissions.length = 0;
const mappedInitial = getInSemSubmissions().filter(s => s && s.fileName);
assert.strictEqual(mappedInitial.length, 0, "TEST 1 PASS: Zero uploads produces zero mapped submissions.");
console.log("✓ TEST 1 PASS: Zero uploads produces zero mapped submissions (Section 03 empty state).");

// Step 2: Individual upload for Rahul Patil
const rahul = inSemEnrolledStudents.find(s => s.id === "stu-rahul");
assert.ok(rahul, "Rahul Patil exists in enrolled roster.");

mapAnswerSheetToStudent(rahul, { name: "iot1.pdf", size: 1024, type: "application/pdf" });
const mappedAfterRahul = getInSemSubmissions().filter(s => s && s.fileName);
assert.strictEqual(mappedAfterRahul.length, 1, "TEST 2 PASS: Exactly 1 submission after Rahul mapping.");
assert.strictEqual(mappedAfterRahul[0].studentId, "stu-rahul", "Mapped submission belongs to Rahul.");
assert.strictEqual(mappedAfterRahul[0].fileName, "iot1.pdf", "FileName is iot1.pdf.");
console.log("✓ TEST 2 PASS: Individual mapping for Rahul creates exactly 1 mapped submission.");

// Step 3: Individual upload for Sneha Kulkarni
const sneha = inSemEnrolledStudents.find(s => s.id === "stu-sneha");
assert.ok(sneha, "Sneha Kulkarni exists in enrolled roster.");

mapAnswerSheetToStudent(sneha, { name: "iot2.pdf", size: 1024, type: "application/pdf" });
const mappedAfterSneha = getInSemSubmissions().filter(s => s && s.fileName);
assert.strictEqual(mappedAfterSneha.length, 2, "TEST 3 PASS: Exactly 2 submissions after Sneha mapping.");
assert.strictEqual(mappedAfterSneha[1].studentId, "stu-sneha", "Second mapped submission belongs to Sneha.");
assert.strictEqual(mappedAfterSneha[1].fileName, "iot2.pdf", "FileName is iot2.pdf.");
console.log("✓ TEST 3 PASS: Individual mapping for Sneha creates exactly 2 mapped submissions.");

// Step 4: Verify duplicate re-upload updates existing record without creating duplicate row
mapAnswerSheetToStudent(rahul, { name: "iot1_v2.pdf", size: 2048, type: "application/pdf" });
const mappedAfterDuplicate = getInSemSubmissions().filter(s => s && s.fileName);
assert.strictEqual(mappedAfterDuplicate.length, 2, "TEST 4 PASS: Duplicate upload updates existing record without duplicating row.");
assert.strictEqual(mappedAfterDuplicate.find(s => s.studentId === "stu-rahul").fileName, "iot1_v2.pdf", "Rahul fileName updated.");
console.log("✓ TEST 4 PASS: Duplicate upload updates student submission in-place without adding duplicate row.");

console.log("============================================================");
console.log("ALL IN-SEM MAPPING & SECTION 03 SPECIFICATION TESTS PASSED!");
console.log("============================================================");
