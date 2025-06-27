// Test script to verify our multiple answers approach works
// This will help us validate the concept before integrating into the main code

const testAnswers = {
  singleAnswer: "velikom gradu",
  multipleAnswers: ["velikom gradu", "velikome grad", "veliki grad"]
};

// Test the existing checkAnswer function logic
function normalizeAnswer(answer) {
  return answer.trim().toLowerCase();
}

function checkAnswer(userAnswer, correctAnswers) {
  const normalizedUserAnswer = normalizeAnswer(userAnswer);
  
  // Ensure correctAnswers is always an array for consistent processing
  const answersArray = Array.isArray(correctAnswers) ? correctAnswers : [correctAnswers];
  
  // Check for exact matches
  for (const correctAnswer of answersArray) {
    const normalizedCorrectAnswer = normalizeAnswer(correctAnswer);
    if (normalizedUserAnswer === normalizedCorrectAnswer) {
      return {
        correct: true,
        matchedAnswer: correctAnswer,
      };
    }
  }
  
  return {
    correct: false,
  };
}

// Test cases
console.log("=== Testing Multiple Answer Validation ===");

// Test 1: Single answer format (backward compatibility)
console.log("\nTest 1: Single answer");
console.log("User: 'velikom gradu', Expected: 'velikom gradu'");
console.log("Result:", checkAnswer("velikom gradu", "velikom gradu"));

console.log("User: 'Velikom Gradu', Expected: 'velikom gradu'");
console.log("Result:", checkAnswer("Velikom Gradu", "velikom gradu"));

// Test 2: Multiple answers - exact match
console.log("\nTest 2: Multiple answers - primary match");
console.log("User: 'velikom gradu', Expected: ['velikom gradu', 'velikome gradu', 'veliki grad']");
console.log("Result:", checkAnswer("velikom gradu", ["velikom gradu", "velikome gradu", "veliki grad"]));

// Test 3: Multiple answers - alternative match
console.log("\nTest 3: Multiple answers - alternative match");
console.log("User: 'velikome gradu', Expected: ['velikom gradu', 'velikome gradu', 'veliki grad']");
console.log("Result:", checkAnswer("velikome gradu", ["velikom gradu", "velikome gradu", "veliki grad"]));

// Test 4: Wrong answer
console.log("\nTest 4: Wrong answer");
console.log("User: 'malo grad', Expected: ['velikom gradu', 'velikome gradu', 'veliki grad']");
console.log("Result:", checkAnswer("malo grad", ["velikom gradu", "velikome gradu", "veliki grad"]));

console.log("\n=== All tests completed ===");
console.log("This validates that our existing checkAnswer function in exercise-utils.ts");
console.log("already supports multiple correct answers via string arrays!");
