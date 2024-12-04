export function calculateGenerationMatches(userResponses, allResponses) {
    const generations = ['gen-z', 'millennial', 'gen-x', 'boomer'];
    const matches = {};
    
    generations.forEach(generation => {
        const genResponses = allResponses.filter(r => r.generation === generation);
        if (genResponses.length === 0) return;

        let matchScore = 0;
        userResponses.forEach((response, index) => {
            const genAverage = calculateGenerationAverage(genResponses, index);
            if (response.response === genAverage) {
                matchScore++;
            }
        });

        const percentage = Math.round((matchScore / userResponses.length) * 100);
        matches[generation] = {
            percentage,
            count: genResponses.length
        };
    });

    return sortMatchesByPercentage(matches);
}

function calculateGenerationAverage(responses, questionIndex) {
    const agreementCount = responses.filter(r => 
        r.responses[questionIndex].response === true
    ).length;
    return (agreementCount / responses.length) > 0.5;
}

function sortMatchesByPercentage(matches) {
    return Object.entries(matches)
        .sort(([,a], [,b]) => b.percentage - a.percentage)
        .map(([generation, data]) => ({
            generation: formatGeneration(generation),
            percentage: data.percentage,
            responseCount: data.count
        }));
}

function formatGeneration(gen) {
    const formats = {
        'gen-z': 'Gen Z',
        'millennial': 'Millennial',
        'gen-x': 'Gen X',
        'boomer': 'Baby Boomer'
    };
    return formats[gen] || gen;
} 