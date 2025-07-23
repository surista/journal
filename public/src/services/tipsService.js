// Practice Tips Service
export class TipsService {
    constructor() {
        this.tips = [
            // General Practice Tips
            { category: 'general', text: '🎸 Practice slowly first - speed comes with accuracy!' },
            { category: 'general', text: '🎯 Set specific goals for each practice session' },
            { category: 'general', text: '⏰ Short, focused sessions beat long, unfocused ones' },
            { category: 'general', text: '📝 Keep a practice journal to track your progress' },
            { category: 'general', text: '🎵 Practice with a metronome to improve timing' },
            { category: 'general', text: '🔄 Take breaks every 20-30 minutes to avoid fatigue' },
            { category: 'general', text: '👂 Record yourself playing to hear your progress' },
            { category: 'general', text: '🎼 Learn music theory - it makes everything easier!' },
            
            // Technique Tips
            { category: 'technique', text: '🤚 Keep your fretting hand relaxed and curved' },
            { category: 'technique', text: '🎸 Practice alternate picking for better speed' },
            { category: 'technique', text: '🎵 Work on your vibrato - it adds emotion to notes' },
            { category: 'technique', text: '🤘 Practice hammer-ons and pull-offs slowly' },
            { category: 'technique', text: '🎸 Keep your pick at a 45-degree angle' },
            { category: 'technique', text: '👆 Use the tips of your fingers, not the pads' },
            { category: 'technique', text: '🎵 Practice scales in different positions' },
            
            // Chord Tips
            { category: 'chords', text: '🎸 Practice chord transitions without strumming first' },
            { category: 'chords', text: '🤏 Keep your thumb behind the neck for better reach' },
            { category: 'chords', text: '🎵 Learn the CAGED system for chord shapes' },
            { category: 'chords', text: '💪 Build finger strength with chord exercises' },
            { category: 'chords', text: '🎸 Practice barre chords - they unlock the fretboard!' },
            
            // Rhythm Tips
            { category: 'rhythm', text: '🥁 Count out loud while playing rhythms' },
            { category: 'rhythm', text: '🎵 Start with downstrokes, add upstrokes later' },
            { category: 'rhythm', text: '⏱️ Use a metronome - start slow, increase gradually' },
            { category: 'rhythm', text: '🎸 Practice strumming patterns without fretting' },
            { category: 'rhythm', text: '👏 Clap rhythms before playing them' },
            
            // Performance Tips
            { category: 'performance', text: '🎤 Practice performing - even to a mirror!' },
            { category: 'performance', text: '😌 Breathe deeply to reduce performance anxiety' },
            { category: 'performance', text: '🎸 Have a backup plan for equipment failures' },
            { category: 'performance', text: '📹 Record your performances to improve' },
            
            // Motivation Tips
            { category: 'motivation', text: '🌟 Every guitarist started as a beginner' },
            { category: 'motivation', text: '💪 Consistency beats intensity - practice daily!' },
            { category: 'motivation', text: '🎉 Celebrate small victories along the way' },
            { category: 'motivation', text: '🎸 Play music you love - it keeps you motivated' },
            { category: 'motivation', text: '👥 Find other musicians to jam with' },
            { category: 'motivation', text: '🎯 Progress isn\'t always linear - keep going!' },
            
            // App-Specific Tips
            { category: 'app', text: '💡 Use the tempo slider to slow down difficult passages' },
            { category: 'app', text: '🔄 Create loops to practice tricky sections' },
            { category: 'app', text: '📊 Check your stats to see practice patterns' },
            { category: 'app', text: '🎯 Set daily goals to maintain consistency' },
            { category: 'app', text: '🏆 Earn badges by meeting your practice goals' },
            { category: 'app', text: '📈 Track your repertoire progress regularly' },
            { category: 'app', text: '🎵 Use pitch shift to practice in different keys' }
        ];
        
        this.lastTipIndex = -1;
        this.tipRotationInterval = null;
    }
    
    getRandomTip(category = null) {
        let availableTips = category 
            ? this.tips.filter(tip => tip.category === category)
            : this.tips;
            
        // Ensure we don't repeat the last tip
        if (availableTips.length > 1) {
            let newIndex;
            do {
                newIndex = Math.floor(Math.random() * availableTips.length);
            } while (availableTips[newIndex] === this.tips[this.lastTipIndex]);
            
            const selectedTip = availableTips[newIndex];
            this.lastTipIndex = this.tips.indexOf(selectedTip);
            return selectedTip.text;
        }
        
        return availableTips[0]?.text || 'Keep practicing! 🎸';
    }
    
    getTipForContext(context) {
        // Return tips based on current context
        if (context.practiceArea) {
            switch (context.practiceArea.toLowerCase()) {
                case 'scales':
                case 'arpeggios':
                    return this.getRandomTip('technique');
                case 'chords':
                    return this.getRandomTip('chords');
                case 'rhythm':
                    return this.getRandomTip('rhythm');
                case 'songs':
                    return this.getRandomTip('performance');
                default:
                    return this.getRandomTip();
            }
        }
        
        // Return app-specific tips occasionally
        if (Math.random() < 0.3) {
            return this.getRandomTip('app');
        }
        
        return this.getRandomTip();
    }
    
    startRotatingTips(headerInstance, interval = 30000) {
        // Stop any existing rotation
        this.stopRotatingTips();
        
        // Show first tip immediately
        const firstTip = this.getRandomTip();
        headerInstance.setStatus(firstTip, 'success');
        
        // Rotate tips at specified interval
        this.tipRotationInterval = setInterval(() => {
            const tip = this.getRandomTip();
            headerInstance.setStatus(tip, 'success');
        }, interval);
    }
    
    stopRotatingTips() {
        if (this.tipRotationInterval) {
            clearInterval(this.tipRotationInterval);
            this.tipRotationInterval = null;
        }
    }
}

// Create singleton instance
export const tipsService = new TipsService();