// Enhanced Fretboard Diagram Component with proper string/fret layout

class FretboardDiagramV2 {
    constructor() {
        this.strings = ['E', 'B', 'G', 'D', 'A', 'E']; // High to low
        this.totalFrets = 15; // Show more frets
        this.startFret = 0;
        
        // Standard tuning note values (0-11, where 0=C, 1=C#, etc.)
        this.openStringNotes = {
            'E': 4,      // E (high)
            'B': 11,     // B
            'G': 7,      // G
            'D': 2,      // D
            'A': 9,      // A
            'E_low': 4   // E (low)
        };
        
        // Note names
        this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        // Scale intervals
        this.scaleIntervals = {
            major: [0, 2, 4, 5, 7, 9, 11], // Major scale intervals
            majorPentatonic: [0, 2, 4, 7, 9], // Major pentatonic intervals
            minor: [0, 2, 3, 5, 7, 8, 10], // Natural minor intervals
            minorPentatonic: [0, 3, 5, 7, 10] // Minor pentatonic intervals
        };
        
        // Scale definitions with root notes
        this.scales = {
            major: {
                title: 'C Major Scale - Open Position',
                root: 0, // C
                intervals: this.scaleIntervals.major,
                startFret: 0,
                endFret: 3
            },
            majorPentatonic: {
                title: 'C Major Pentatonic - Open Position',
                root: 0, // C
                intervals: this.scaleIntervals.majorPentatonic,
                startFret: 0,
                endFret: 3
            },
            minor: {
                title: 'A Minor Scale - Open Position',
                root: 9, // A
                intervals: this.scaleIntervals.minor,
                startFret: 0,
                endFret: 3
            },
            minorPentatonic: {
                title: 'A Minor Pentatonic - Open Position',
                root: 9, // A
                intervals: this.scaleIntervals.minorPentatonic,
                startFret: 0,
                endFret: 3
            }
        };
    }
    
    generateDiagram(scaleType) {
        const scale = this.scales[scaleType];
        if (!scale) return '';
        
        const scaleNotes = this.getScaleNotes(scale);
        const fretRange = scale.endFret - scale.startFret + 1;
        
        return `
            <div class="fretboard-diagram-v2">
                <h3 class="fretboard-title">${scale.title}</h3>
                <div class="fretboard-wrapper">
                    <div class="fretboard-container-v2">
                        ${this.generateFretNumbers(scale.startFret, fretRange)}
                        <div class="fretboard-v2">
                            ${this.generateFrets(scale.startFret, fretRange)}
                            ${this.generateStrings()}
                            ${this.generateNotes(scaleNotes, scale)}
                        </div>
                    </div>
                </div>
                ${this.generateLegend()}
                ${this.generateScaleInfo(scale)}
            </div>
        `;
    }
    
    getScaleNotes(scale) {
        const notes = new Set();
        scale.intervals.forEach(interval => {
            notes.add((scale.root + interval) % 12);
        });
        return notes;
    }
    
    generateFretNumbers(startFret, fretCount) {
        let numbers = '<div class="fret-numbers-v2">';
        
        for (let i = 0; i < fretCount; i++) {
            const fretNum = startFret + i;
            if (fretNum === 0) {
                numbers += '<div class="fret-number-v2"></div>';
            } else {
                numbers += `<div class="fret-number-v2">${fretNum}</div>`;
            }
        }
        
        numbers += '</div>';
        return numbers;
    }
    
    generateFrets(startFret, fretCount) {
        let frets = '<div class="frets-v2">';
        
        for (let i = 0; i < fretCount; i++) {
            const fretNum = startFret + i;
            const isNut = fretNum === 0;
            
            frets += `<div class="fret-v2 ${isNut ? 'nut' : ''}">`;
            
            // Add position markers
            if ([3, 5, 7, 9, 15, 17, 19, 21].includes(fretNum)) {
                frets += '<div class="position-marker"></div>';
            } else if (fretNum === 12) {
                frets += '<div class="position-marker double-marker"></div>';
            }
            
            frets += '</div>';
        }
        
        frets += '</div>';
        return frets;
    }
    
    generateStrings() {
        let strings = '<div class="strings-v2">';
        
        this.strings.forEach((string, index) => {
            strings += `<div class="string-v2" data-string="${index}"></div>`;
        });
        
        strings += '</div>';
        return strings;
    }
    
    generateNotes(scaleNotes, scale) {
        let notesHtml = '<div class="notes-v2">';
        
        const fretRange = scale.endFret - scale.startFret + 1;
        
        this.strings.forEach((string, stringIndex) => {
            const stringKey = stringIndex === 5 ? 'E_low' : string;
            const openNote = this.openStringNotes[stringKey];
            
            for (let fret = 0; fret < fretRange; fret++) {
                const actualFret = scale.startFret + fret;
                const noteValue = (openNote + actualFret) % 12;
                
                if (scaleNotes.has(noteValue)) {
                    const isRoot = noteValue === scale.root;
                    const leftPos = this.calculateNotePosition(fret, fretRange);
                    const topPos = this.calculateStringPosition(stringIndex);
                    
                    notesHtml += `
                        <div class="note-v2 ${isRoot ? 'root' : 'scale'}" 
                             style="left: ${leftPos}%; top: ${topPos}%">
                            ${isRoot ? '1' : ''}
                        </div>
                    `;
                }
            }
        });
        
        notesHtml += '</div>';
        return notesHtml;
    }
    
    calculateNotePosition(fretIndex, totalFrets) {
        if (fretIndex === 0) {
            return 2; // Slightly offset from the nut
        }
        const fretWidth = 98 / totalFrets;
        return 2 + (fretIndex * fretWidth) - (fretWidth / 2);
    }
    
    calculateStringPosition(stringIndex) {
        const stringSpacing = 88 / (this.strings.length - 1);
        return 6 + (stringIndex * stringSpacing);
    }
    
    generateLegend() {
        return `
            <div class="fretboard-legend-v2">
                <div class="legend-item">
                    <div class="legend-dot-v2 root">1</div>
                    <span>Root Note</span>
                </div>
                <div class="legend-item">
                    <div class="legend-dot-v2 scale"></div>
                    <span>Scale Note</span>
                </div>
            </div>
        `;
    }
    
    generateScaleInfo(scale) {
        const rootName = this.noteNames[scale.root];
        const intervalNames = scale.intervals.map(i => this.noteNames[(scale.root + i) % 12]).join(' - ');
        
        return `
            <div class="scale-info-v2">
                <div><strong>Root:</strong> ${rootName}</div>
                <div><strong>Notes:</strong> ${intervalNames}</div>
            </div>
        `;
    }
}

export default FretboardDiagramV2;