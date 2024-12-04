document.addEventListener('DOMContentLoaded', function() {
    const resultId = new URLSearchParams(window.location.search).get('id');
    if (resultId) {
        fetchResults(resultId);
    }
});

function fetchResults(resultId) {
    fetch(`/api/results/${resultId}`)
        .then(response => response.json())
        .then(data => displayResults(data))
        .catch(error => console.error('Error:', error));
}

function displayResults(data) {
    // Calculate generation matches and display them
    const matchesContainer = document.querySelector('.generation-matches');
    data.matches.forEach(match => {
        const matchElement = document.createElement('div');
        matchElement.classList.add('generation-match');
        matchElement.innerHTML = `
            <h3>${match.generation}</h3>
            <div class="match-percentage">${match.percentage}% match</div>
            <div class="match-bar">
                <div class="match-fill" style="width: ${match.percentage}%"></div>
            </div>
        `;
        matchesContainer.appendChild(matchElement);
    });
} 