class SportsScoreboard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.gameEvents = [];
        this.currentEventIndex = 0;
    }

    static get observedAttributes() {
        return ['home-score', 'away-score', 'game-status', 'period', 'time-remaining'];
    }

    connectedCallback() {
        this.render();
        
        // Dispatch ready event
        this.dispatchEvent(new CustomEvent('scoreboard-ready', {
            bubbles: true,
            composed: true
        }));
        
        // Start self-contained update simulation
        this.startSimulation();
    }

    disconnectedCallback() {
        // Clean up interval when component is removed
        if (this.simulationTimeout) {
            clearTimeout(this.simulationTimeout);
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
        this.simulationTimeout = setTimeout(() => this.replayEvents(), 5000);
    }

    applyEvent(event) {
        this.setAttribute('home-score', event.homeScore);
        this.setAttribute('away-score', event.awayScore);
        this.setAttribute('game-status', event.status);
        this.setAttribute('period', event.period);
        this.setAttribute('time-remaining', event.timeRemaining);
    }

    fallbackSimulation() {
        // Fallback to random updates if JSON fails to load
        const updateScores = () => {
            const homeScore = Math.floor(Math.random() * 100);
            const awayScore = Math.floor(Math.random() * 100);
            
            this.setAttribute('home-score', homeScore);
            this.setAttribute('away-score', awayScore);
            
            this.simulationTimeout = setTimeout(updateScores, 5000);
        };
        updateScores();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.shadowRoot.querySelector('.scoreboard')) {
            switch (name) {
                case 'home-score':
                case 'away-score':
                    this.updateScore(name, newValue);
                    break;
                case 'game-status':
                    this.shadowRoot.querySelector('.game-status').textContent = newValue;
                    break;
                case 'period':
                case 'time-remaining':
                    this.updateTime();
                    break;
            }
        }
    }

    updateScore(type, newScore) {
        const team = type === 'home-score' ? 'home' : 'away';
        const scoreElement = this.shadowRoot.querySelector(`.team-score[data-team="${team}"]`);
        this.animateScore(scoreElement, newScore);
    }

    updateTime() {
        const period = this.getAttribute('period');
        const timeRemaining = this.getAttribute('time-remaining');
        this.shadowRoot.querySelector('.game-time').textContent = `${period} ${timeRemaining}`;
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
                    <span class="game-status">${this.getAttribute('game-status')}</span>
                    <span class="game-time">${this.getAttribute('period')} ${this.getAttribute('time-remaining')}</span>
                </div>
                <div class="teams">
                    <div class="team">
                        <span class="team-name">${this.getAttribute('home-team')}</span>
                        <span class="team-score" data-team="home">${this.getAttribute('home-score')}</span>
                    </div>
                    <div class="team">
                        <span class="team-name">${this.getAttribute('away-team')}</span>
                        <span class="team-score" data-team="away">${this.getAttribute('away-score')}</span>
                    </div>
                </div>
            </div>
        `;
    }
}

// Register the web component
customElements.define('sports-scoreboard', SportsScoreboard);