import express from 'express';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Database setup with default data
const questionsDb = new Low(new JSONFile('db.json'), { questions: [] });
const responsesDb = new Low(new JSONFile('responses.json'), { responses: [] });

// Initialize databases
await questionsDb.read();
await responsesDb.read();

app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', async (req, res) => {
    await questionsDb.read();
    res.render('survey', { questions: questionsDb.data.questions });
});

app.post('/submit-response', async (req, res) => {
    await responsesDb.read();
    
    const response = {
        generation: req.body.generation,
        answers: req.body.answers,
        timestamp: new Date()
    };
    
    responsesDb.data.responses.push(response);
    await responsesDb.write();
    
    const matches = calculateGenerationalMatches(req.body.answers, req.body.generation);
    res.json({ matches });
});

function calculateGenerationalMatches(userAnswers, userGeneration) {
    const allResponses = responsesDb.data.responses;
    const generations = {};
    
    allResponses.forEach(response => {
        if (response.generation !== userGeneration) {
            if (!generations[response.generation]) {
                generations[response.generation] = {
                    totalQuestions: 0,
                    matches: 0
                };
            }
        }
    });
    
    userAnswers.forEach(userAnswer => {
        allResponses.forEach(response => {
            if (response.generation !== userGeneration) {
                const theirAnswer = response.answers.find(a => a.question === userAnswer.question);
                if (theirAnswer) {
                    generations[response.generation].totalQuestions++;
                    if (theirAnswer.response === userAnswer.response) {
                        generations[response.generation].matches++;
                    }
                }
            }
        });
    });
    
    const matches = {};
    Object.entries(generations).forEach(([generation, data]) => {
        if (data.totalQuestions > 0) {
            matches[generation] = Math.round((data.matches / data.totalQuestions) * 100);
        } else {
            matches[generation] = 0;
        }
    });
    
    return matches;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});