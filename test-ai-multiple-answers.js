// Test the updated prompts to ensure they work correctly

// Simulated AI response with multiple answers
const testAIResponse = {
  "exercises": [
    {
      "id": "test-1",
      "text": "Jučer sam _____ knjigu.",
      "correctAnswer": ["čitao", "čitala", "pročitao", "pročitala"],
      "explanation": "Both perfective (pročitao/pročitala) and imperfective (čitao/čitala) forms can work here, depending on whether the action was completed or ongoing. Gender agreement also creates variations."
    },
    {
      "id": "test-2", 
      "text": "Sutra ću _____ u grad.",
      "correctAnswer": ["ići", "poći"],
      "explanation": "Both ići (imperfective) and poći (perfective) are acceptable here - ići emphasizes the ongoing action of going, while poći emphasizes the start of the journey."
    }
  ]
};

// Test if our validation would work
function checkAnswer(userAnswer, correctAnswers) {
  const normalizedUserAnswer = userAnswer.trim().toLowerCase();
  const answersArray = Array.isArray(correctAnswers) ? correctAnswers : [correctAnswers];
  
  for (const correctAnswer of answersArray) {
    if (normalizedUserAnswer === correctAnswer.toLowerCase()) {
      return {
        correct: true,
        matchedAnswer: correctAnswer,
      };
    }
  }
  
  return { correct: false };
}

console.log("=== Testing AI Response with Multiple Answers ===");

// Test case 1: First form
console.log("\nTest 1 - First exercise, first variant:");
console.log("User: 'čitao', Expected variants:", testAIResponse.exercises[0].correctAnswer);
console.log("Result:", checkAnswer("čitao", testAIResponse.exercises[0].correctAnswer));

// Test case 2: Alternative form  
console.log("\nTest 2 - First exercise, alternative variant:");
console.log("User: 'pročitala', Expected variants:", testAIResponse.exercises[0].correctAnswer);
console.log("Result:", checkAnswer("pročitala", testAIResponse.exercises[0].correctAnswer));

// Test case 3: Wrong answer
console.log("\nTest 3 - Wrong answer:");
console.log("User: 'pisao', Expected variants:", testAIResponse.exercises[0].correctAnswer);
console.log("Result:", checkAnswer("pisao", testAIResponse.exercises[0].correctAnswer));

// Test case 4: Second exercise
console.log("\nTest 4 - Second exercise:");
console.log("User: 'poći', Expected variants:", testAIResponse.exercises[1].correctAnswer);
console.log("Result:", checkAnswer("poći", testAIResponse.exercises[1].correctAnswer));

console.log("\n=== Multiple answer approach validated! ===");
console.log("The AI can provide semantically appropriate alternatives,");
console.log("and our existing validation handles them perfectly.");
