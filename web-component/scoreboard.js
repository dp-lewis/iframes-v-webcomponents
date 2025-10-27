class SportsScoreboard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['home-score', 'away-score', 'game-status', 'period', 'time-remaining'];
    }

    connectedCallback() {
        // Import shared styles
        const linkElem = document.createElement('link');
        linkElem.setAttribute('rel', 'stylesheet');
        linkElem.setAttribute('href', '../shared/styles/scoreboard.css');
        
        this.shadowRoot.appendChild(linkElem);
        this.render();
        
        // Dispatch ready event
        this.dispatchEvent(new CustomEvent('scoreboard-ready', {
            bubbles: true,
            composed: true
        }));
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
            <link rel="stylesheet" href="../shared/styles/scoreboard.css">
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