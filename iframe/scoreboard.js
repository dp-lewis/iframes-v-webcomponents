class Scoreboard {
    constructor() {
        this.gameStatus = document.querySelector('.game-status');
        this.gameTime = document.querySelector('.game-time');
        this.homeScore = document.querySelector('.team-score[data-team="home"]');
        this.awayScore = document.querySelector('.team-score[data-team="away"]');
        
        this.gameEvents = [];
        this.currentEventIndex = 0;
        
        // Listen for score updates from parent (for external control if needed)
        window.addEventListener('message', this.handleMessage.bind(this));
        
        // Signal ready to parent
        window.parent.postMessage({ type: 'SCOREBOARD_READY' }, '*');
        
        // Start self-contained update simulation
        this.startSimulation();
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

    async startSimulation() {
        try {
            // Fetch game events data
            const response = await fetch('/shared/data/game-events.json');
            const data = await response.json();
            this.gameEvents = data.events;
            
            // Start replaying events
            this.replayEvents();
        } catch (error) {
            console.error('Failed to load game events:', error);
            // Fallback to simple simulation if fetch fails
            this.fallbackSimulation();
        }
    }

    replayEvents() {
        if (!this.gameEvents || this.gameEvents.length === 0) {
            this.fallbackSimulation();
            return;
        }

        // Apply the current event
        const event = this.gameEvents[this.currentEventIndex];
        this.applyEvent(event);

        // Move to next event (loop back to start if at end)
        this.currentEventIndex = (this.currentEventIndex + 1) % this.gameEvents.length;

        // Schedule next update (every 5 seconds)
        setTimeout(() => this.replayEvents(), 5000);
    }

    applyEvent(event) {
        this.updateScore({ home: event.homeScore, away: event.awayScore });
        this.updateTime({ period: event.period, timeRemaining: event.timeRemaining });
        this.updateStatus(event.status);
    }

    fallbackSimulation() {
        // Fallback to random updates if JSON fails to load
        setInterval(() => {
            const homeScore = Math.floor(Math.random() * 100);
            const awayScore = Math.floor(Math.random() * 100);
            this.updateScore({ home: homeScore, away: awayScore });
        }, 5000);
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