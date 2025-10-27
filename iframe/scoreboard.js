class Scoreboard {
    constructor() {
        this.gameStatus = document.querySelector('.game-status');
        this.gameTime = document.querySelector('.game-time');
        this.homeScore = document.querySelector('.team-score[data-team="home"]');
        this.awayScore = document.querySelector('.team-score[data-team="away"]');
        
        // Listen for score updates from parent
        window.addEventListener('message', this.handleMessage.bind(this));
        
        // Signal ready to parent
        window.parent.postMessage({ type: 'SCOREBOARD_READY' }, '*');
    }

    handleMessage(event) {
        const { type, data } = event.data;
        
        switch (type) {
            case 'UPDATE_SCORE':
                this.updateScore(data);
                break;
            case 'UPDATE_TIME':
                this.updateTime(data);
                break;
            case 'UPDATE_STATUS':
                this.updateStatus(data);
                break;
        }
    }

    updateScore(data) {
        if (data.home !== undefined) {
            this.animateScore(this.homeScore, data.home);
        }
        if (data.away !== undefined) {
            this.animateScore(this.awayScore, data.away);
        }
    }

    updateTime(data) {
        this.gameTime.textContent = `${data.period} ${data.timeRemaining}`;
    }

    updateStatus(status) {
        this.gameStatus.textContent = status;
    }

    animateScore(element, newScore) {
        element.classList.add('score-updated');
        element.textContent = newScore;
        
        // Remove animation class after animation completes
        setTimeout(() => {
            element.classList.remove('score-updated');
        }, 300);
    }
}

// Initialize scoreboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Scoreboard();
});