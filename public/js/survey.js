let currentQuestionIndex = 0;
let isExplanationStep = false;
let userAnswers = [];
let userGeneration = null;
let currentAnswer = null;
let hammer = null;

// Debug log to check if questions are loaded
console.log('Loaded questions:', surveyQuestions);

function displayCurrentQuestion() {
    const question = surveyQuestions[currentQuestionIndex];
    const cardStack = document.getElementById('card-stack');
    const card = document.createElement('div');
    card.className = 'card current';

    if (question.type === 'welcome') {
        const title = document.createElement('h2');
        title.textContent = question.text;
        card.appendChild(title);

        const instructions = document.createElement('p');
        instructions.className = 'swipe-instructions';
        instructions.textContent = 'Swipe in any direction to begin';
        card.appendChild(instructions);
    } else if (question.type === 'generation-select') {
        displayGenerationQuestion(card, question);
    } else if (question.type === 'two-step') {
        if (!isExplanationStep) {
            displaySwipeQuestion(card, question);
        } else {
            displayExplanationStep(card, question);
        }
    }

    cardStack.innerHTML = '';
    cardStack.appendChild(card);
}

function displayGenerationQuestion(card, question) {
    const title = document.createElement('h2');
    title.textContent = question.text;
    card.appendChild(title);

    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'generation-options';
    
    question.options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'gen-option';
        button.textContent = option;
        button.onclick = () => handleGenerationSelect(option);
        optionsDiv.appendChild(button);
    });
    
    card.appendChild(optionsDiv);
}

function displaySwipeQuestion(card, question) {
    const title = document.createElement('h2');
    title.textContent = question.text;
    card.appendChild(title);

    const instructions = document.createElement('div');
    instructions.className = 'swipe-instructions';
    instructions.innerHTML = `
        <p>← Swipe left to disagree</p>
        <p>Swipe right to agree →</p>
    `;
    card.appendChild(instructions);
}

function displayExplanationStep(card, question) {
    const title = document.createElement('h2');
    title.textContent = "Would you like to explain your answer?";
    card.appendChild(title);

    const previousAnswer = document.createElement('p');
    previousAnswer.className = 'previous-answer';
    previousAnswer.textContent = `Your answer: ${currentAnswer === 'agree' ? 'Yes' : 'No'}`;
    card.appendChild(previousAnswer);

    const textarea = document.createElement('textarea');
    textarea.className = 'response-input';
    textarea.placeholder = 'Optional: Share your thoughts...';
    card.appendChild(textarea);

    const continueText = document.createElement('p');
    continueText.className = 'continue-instruction';
    continueText.textContent = 'Swipe in any direction to continue';
    card.appendChild(continueText);
}

function handleGenerationSelect(option) {
    userGeneration = option;
    moveToNextQuestion();
}

function handleSwipeResponse(direction) {
    if (surveyQuestions[currentQuestionIndex].type === 'welcome') {
        moveToNextQuestion();
        return;
    }

    if (surveyQuestions[currentQuestionIndex].type === 'two-step') {
        if (!isExplanationStep) {
            currentAnswer = direction === 'right' ? 'agree' : 'disagree';
            isExplanationStep = true;
            displayCurrentQuestion();
        } else {
            const explanation = document.querySelector('.response-input')?.value || '';
            userAnswers.push({
                question: currentQuestionIndex,
                response: currentAnswer,
                explanation: explanation
            });
            isExplanationStep = false;
            moveToNextQuestion();
        }
    }
}

function moveToNextQuestion() {
    if (isExplanationStep) {
        isExplanationStep = false;
    }
    
    currentQuestionIndex++;
    
    if (currentQuestionIndex >= surveyQuestions.length) {
        submitSurvey();
        return;
    }
    
    displayCurrentQuestion();
}

function submitSurvey() {
    fetch('/submit-response', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            generation: userGeneration,
            answers: userAnswers
        })
    })
    .then(response => response.json())
    .then(data => {
        showResults(data.matches);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function showResults(matches) {
    const cardStack = document.getElementById('card-stack');
    cardStack.innerHTML = `
        <div class="card current results">
            <h2>Your Results</h2>
            <p>Here's how your answers match with other generations:</p>
            <div class="matches">
                ${Object.entries(matches)
                    .map(([gen, percentage]) => `
                        <div class="match-row">
                            <span class="generation">${gen}</span>
                            <div class="percentage-bar">
                                <div class="percentage-fill" style="width: ${percentage}%"></div>
                            </div>
                            <span class="percentage-number">${percentage}%</span>
                        </div>
                    `).join('')}
            </div>
        </div>
    `;
}

// Initialize Hammer.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing survey...');
    const cardStack = document.getElementById('card-stack');
    hammer = new Hammer(cardStack);
    console.log('Hammer initialized');

    hammer.on('swipeleft swiperight', function(event) {
        handleSwipeResponse(event.type === 'swiperight' ? 'right' : 'left');
    });

    displayCurrentQuestion();
});