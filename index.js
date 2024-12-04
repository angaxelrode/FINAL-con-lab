import express from 'express';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Database setup with absolute paths for Glitch
const questionsDb = new Low(new JSONFile(path.join(__dirname, 'db.json')), { questions: [] });
const responsesDb = new Low(new JSONFile(path.join(__dirname, 'responses.json')), { responses: [] });

// Initialize databases
try {
    await questionsDb.read();
    await responsesDb.read();
} catch (error) {
    console.error('Database initialization error:', error);
    // Initialize with empty data if files don't exist
    questionsDb.data = { questions: [] };
    responsesDb.data = { responses: [] };
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', async (req, res) => {
    try {
        await questionsDb.read();
        res.render('survey', { questions: questionsDb.data.questions });
    } catch (error) {
        console.error('Error reading questions:', error);
        res.status(500).send('Error loading survey questions');
    }
});

app.post('/submit-response', async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error submitting response:', error);
        res.status(500).send('Error saving response');
    }
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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
