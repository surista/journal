// Simple C Major Scale Fretboard Diagram

class CMajorFretboard {
    constructor() {
        // C Major scale notes
        this.cMajorNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        
        // All notes in chromatic order
        this.allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        // Standard tuning
        this.strings = [
            { name: 'E', startNote: 'E' },
            { name: 'B', startNote: 'B' },
            { name: 'G', startNote: 'G' },
            { name: 'D', startNote: 'D' },
            { name: 'A', startNote: 'A' },
            { name: 'E', startNote: 'E' }
        ];
    }
    
    getNoteAtFret(stringStartNote, fretNumber) {
        const startIndex = this.allNotes.indexOf(stringStartNote);
        const noteIndex = (startIndex + fretNumber) % 12;
        return this.allNotes[noteIndex];
    }
    
    isInCMajor(note) {
        return this.cMajorNotes.includes(note);
    }
    
    generateDiagram() {
        const maxFrets = 12;
        
        let html = `
            <div class="c-major-fretboard">
                <h3>C Major Scale</h3>
                <div class="fretboard-container">
                    <div class="string-names">
                        ${this.strings.map(s => `<div>${s.name}</div>`).join('')}
                    </div>
                    <div class="fretboard">
                        <div class="fret-numbers">
                            <div></div>
                            ${Array.from({length: maxFrets}, (_, i) => `<div>${i + 1}</div>`).join('')}
                        </div>
                        ${this.generateStrings(maxFrets)}
                    </div>
                </div>
                <div class="legend">
                    <span class="legend-item"><span class="dot root"></span> C (Root)</span>
                    <span class="legend-item"><span class="dot scale"></span> Scale Note</span>
                </div>
            </div>
        `;
        
        return html;
    }
    
    generateStrings(maxFrets) {
        let stringsHtml = '';
        
        this.strings.forEach((string) => {
            stringsHtml += '<div class="string">';
            
            // Open string (fret 0)
            const openNote = string.startNote;
            const isOpenInScale = this.isInCMajor(openNote);
            const isOpenRoot = openNote === 'C';
            
            stringsHtml += '<div class="fret open">';
            if (isOpenInScale) {
                stringsHtml += `<div class="note ${isOpenRoot ? 'root' : 'scale'}">${openNote}</div>`;
            }
            stringsHtml += '</div>';
            
            // Frets 1-12
            for (let fret = 1; fret <= maxFrets; fret++) {
                const note = this.getNoteAtFret(string.startNote, fret);
                const isInScale = this.isInCMajor(note);
                const isRoot = note === 'C';
                
                stringsHtml += '<div class="fret">';
                if (isInScale) {
                    stringsHtml += `<div class="note ${isRoot ? 'root' : 'scale'}">${note}</div>`;
                }
                stringsHtml += '</div>';
            }
            
            stringsHtml += '</div>';
        });
        
        return stringsHtml;
    }
}

export default CMajorFretboard;