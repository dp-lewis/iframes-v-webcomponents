class SportsScoreboard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.gameEvents = [];
        this.currentEventIndex = 0;
        
        // Default state
        this.state = {
            homeTeam: 'Red Dragons',
            awayTeam: 'Blue Knights',
            homeScore: 0,
            awayScore: 0,
            status: 'Scheduled',
            period: '1st',
            timeRemaining: '12:00'
        };
    }

    connectedCallback() {
        this.render();
        
        // Start self-contained update simulation
        this.startSimulation();
    }

    disconnectedCallback() {
        // Clean up timeout when component is removed
        if (this.simulationTimeout) {
            clearTimeout(this.simulationTimeout);
        }
    }

    async startSimulation() {
        try {
            // Fetch game events data with cache-busting
            const response = await fetch(`/shared/data/game-events.json?_t=${Date.now()}`);
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
        this.simulationTimeout = setTimeout(() => this.replayEvents(), 5000);
    }

    applyEvent(event) {
        this.state.homeScore = event.homeScore;
        this.state.awayScore = event.awayScore;
        this.state.status = event.status;
        this.state.period = event.period;
        this.state.timeRemaining = event.timeRemaining;
        
        // Update the DOM
        this.updateDisplay();
    }

    updateDisplay() {
        const homeScoreEl = this.shadowRoot.querySelector('[data-team="home"]');
        const awayScoreEl = this.shadowRoot.querySelector('[data-team="away"]');
        const statusEl = this.shadowRoot.querySelector('.game-status');
        const timeEl = this.shadowRoot.querySelector('.game-time');
        
        if (homeScoreEl) {
            this.animateScore(homeScoreEl, this.state.homeScore);
        }
        if (awayScoreEl) {
            this.animateScore(awayScoreEl, this.state.awayScore);
        }
        if (statusEl) {
            statusEl.textContent = this.state.status;
        }
        if (timeEl) {
            timeEl.textContent = `${this.state.period} ${this.state.timeRemaining}`;
        }
    }

    fallbackSimulation() {
        // Fallback to random updates if JSON fails to load
        const updateScores = () => {
            this.state.homeScore = Math.floor(Math.random() * 100);
            this.state.awayScore = Math.floor(Math.random() * 100);
            
            this.updateDisplay();
            
            this.simulationTimeout = setTimeout(updateScores, 5000);
        };
        updateScores();
    }

    animateScore(element, newScore) {
        element.classList.add('score-updated');
        element.textContent = newScore;
        
        setTimeout(() => {
            element.classList.remove('score-updated');
        }, 300);
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .scoreboard {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    background: #1a1a1a;
                    color: #ffffff;
                    border-radius: 8px;
                    padding: 1rem;
                    width: 300px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }

                .scoreboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid #333;
                }

                .game-status {
                    font-size: 0.875rem;
                    color: #00ff00;
                }

                .game-time {
                    font-size: 0.875rem;
                    color: #cccccc;
                }

                .teams {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .team {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .team-name {
                    font-weight: bold;
                    font-size: 1.125rem;
                }

                .team-score {
                    font-size: 1.5rem;
                    font-weight: bold;
                    min-width: 2.5rem;
                    text-align: right;
                }

                @keyframes score-update {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }

                .score-updated {
                    animation: score-update 0.3s ease-in-out;
                }
            </style>
            <div class="scoreboard">
                <div class="scoreboard-header">
                    <span class="game-status">${this.state.status}</span>
                    <span class="game-time">${this.state.period} ${this.state.timeRemaining}</span>
                </div>
                <div class="teams">
                    <div class="team">
                        <span class="team-name">${this.state.homeTeam}</span>
                        <span class="team-score" data-team="home">${this.state.homeScore}</span>
                    </div>
                    <div class="team">
                        <span class="team-name">${this.state.awayTeam}</span>
                        <span class="team-score" data-team="away">${this.state.awayScore}</span>
                    </div>
                </div>
            </div>
        `;
    }
}

// Register the web component
customElements.define('sports-scoreboard', SportsScoreboard);