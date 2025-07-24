// Simple, clean fretboard diagram component

class FretboardDiagramSimple {
    constructor() {
        this.strings = ['E', 'B', 'G', 'D', 'A', 'E']; // High to low
        
        // Standard tuning note values (0-11, where 0=C)
        this.openStringNotes = {
            'E': 4,      // E (high)
            'B': 11,     // B
            'G': 7,      // G
            'D': 2,      // D
            'A': 9,      // A
            'E_low': 4   // E (low)
        };
        
        this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        // Scale patterns for open position (frets 0-3)
        this.scales = {
            major: {
                title: 'C Major Scale - Open Position',
                notes: {
                    'E': [0, 1, 3],      // E, F, G
                    'B': [0, 1, 3],      // B, C, D  
                    'G': [0, 2],         // G, A
                    'D': [0, 2, 3],      // D, E, F
                    'A': [0, 2, 3],      // A, B, C
                    'E_low': [0, 1, 3]   // E, F, G
                },
                rootNote: 'C',
                rootPositions: [
                    { string: 1, fret: 1 },   // C on B string
                    { string: 4, fret: 3 }    // C on A string
                ]
            },
            majorPentatonic: {
                title: 'C Major Pentatonic - Open Position',
                notes: {
                    'E': [0, 3],         // E, G
                    'B': [1, 3],         // C, D
                    'G': [0, 2],         // G, A
                    'D': [0, 2],         // D, E
                    'A': [0, 3],         // A, C
                    'E_low': [0, 3]      // E, G
                },
                rootNote: 'C',
                rootPositions: [
                    { string: 1, fret: 1 },   // C on B string
                    { string: 4, fret: 3 }    // C on A string
                ]
            },
            minor: {
                title: 'A Minor Scale - Open Position',
                notes: {
                    'E': [0, 1, 3],      // E, F, G
                    'B': [0, 1, 3],      // B, C, D
                    'G': [0, 2],         // G, A
                    'D': [0, 2, 3],      // D, E, F
                    'A': [0, 2, 3],      // A, B, C
                    'E_low': [0, 1, 3]   // E, F, G
                },
                rootNote: 'A',
                rootPositions: [
                    { string: 2, fret: 2 },   // A on G string
                    { string: 4, fret: 0 }    // A open string
                ]
            },
            minorPentatonic: {
                title: 'A Minor Pentatonic - Open Position',
                notes: {
                    'E': [0, 3],         // E, G
                    'B': [1, 3],         // C, D
                    'G': [0, 2],         // G, A
                    'D': [0, 2],         // D, E
                    'A': [0, 3],         // A, C
                    'E_low': [0, 3]      // E, G
                },
                rootNote: 'A',
                rootPositions: [
                    { string: 2, fret: 2 },   // A on G string
                    { string: 4, fret: 0 }    // A open string
                ]
            }
        };
    }
    
    generateDiagram(scaleType) {
        const scale = this.scales[scaleType];
        if (!scale) return '';
        
        return `
            <div class="fretboard-simple">
                <h3 class="fretboard-title">${scale.title}</h3>
                <div class="fretboard-container-simple">
                    <div class="fret-numbers-simple">
                        <span></span>
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                    </div>
                    <div class="fretboard-grid">
                        ${this.generateGrid(scale)}
                    </div>
                    <div class="string-labels-simple">
                        ${this.strings.map(s => `<span>${s}</span>`).join('')}
                    </div>
                </div>
                <div class="fretboard-legend-simple">
                    <span class="legend-item"><span class="dot root"></span> Root (${scale.rootNote})</span>
                    <span class="legend-item"><span class="dot scale"></span> Scale Note</span>
                </div>
            </div>
        `;
    }
    
    generateGrid(scale) {
        let grid = '';
        
        // Generate grid for each string
        this.strings.forEach((string, stringIndex) => {
            const stringKey = stringIndex === 5 ? 'E_low' : string;
            const stringNotes = scale.notes[stringKey] || [];
            
            for (let fret = 0; fret <= 3; fret++) {
                const hasNote = stringNotes.includes(fret);
                const isRoot = scale.rootPositions.some(pos => 
                    pos.string === stringIndex && pos.fret === fret
                );
                
                let cellClass = 'fret-cell';
                if (fret === 0) cellClass += ' open-string';
                
                let noteClass = '';
                if (hasNote) {
                    noteClass = isRoot ? 'note root' : 'note scale';
                }
                
                grid += `<div class="${cellClass}">`;
                if (hasNote) {
                    grid += `<div class="${noteClass}"></div>`;
                }
                grid += '</div>';
            }
        });
        
        return grid;
    }
}

export default FretboardDiagramSimple;