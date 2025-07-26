// Fretboard diagram component that shows note names

class FretboardWithNotes {
    constructor() {
        this.strings = ['E', 'B', 'G', 'D', 'A', 'E']; // High to low
        this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

        // Open string notes (in semitones from C)
        this.openStringValues = {
            E: 4, // E (high)
            B: 11, // B
            G: 7, // G
            D: 2, // D
            A: 9, // A
            E_low: 4 // E (low)
        };

        // Scale formulas
        this.scaleFormulas = {
            major: [0, 2, 4, 5, 7, 9, 11],
            majorPentatonic: [0, 2, 4, 7, 9],
            minor: [0, 2, 3, 5, 7, 8, 10],
            minorPentatonic: [0, 3, 5, 7, 10]
        };

        // Scale configurations
        this.scales = {
            major: {
                title: 'C Major Scale - Open Position',
                root: 'C',
                rootValue: 0,
                formula: this.scaleFormulas.major,
                fretStart: 0,
                fretEnd: 5
            },
            majorPentatonic: {
                title: 'C Major Pentatonic - Open Position',
                root: 'C',
                rootValue: 0,
                formula: this.scaleFormulas.majorPentatonic,
                fretStart: 0,
                fretEnd: 5
            },
            minor: {
                title: 'A Minor Scale - Open Position',
                root: 'A',
                rootValue: 9,
                formula: this.scaleFormulas.minor,
                fretStart: 0,
                fretEnd: 5
            },
            minorPentatonic: {
                title: 'A Minor Pentatonic - Open Position',
                root: 'A',
                rootValue: 9,
                formula: this.scaleFormulas.minorPentatonic,
                fretStart: 0,
                fretEnd: 5
            }
        };
    }

    generateDiagram(scaleType) {
        const scale = this.scales[scaleType];
        if (!scale) return '';

        const scaleNotes = this.getScaleNotes(scale);
        const fretCount = scale.fretEnd - scale.fretStart + 1;

        return `
            <div class="fretboard-notes">
                <h3 class="fretboard-title">${scale.title}</h3>
                <div class="fretboard-wrapper-notes">
                    <div class="string-labels-notes">
                        ${this.strings.map((s) => `<div class="string-label-note">${s}</div>`).join('')}
                    </div>
                    <div class="fretboard-main">
                        <div class="fret-numbers-notes">
                            ${this.generateFretNumbers(scale.fretStart, fretCount)}
                        </div>
                        <div class="fretboard-body-notes">
                            ${this.generateFretboard(scale, scaleNotes)}
                        </div>
                    </div>
                </div>
                <div class="legend-notes">
                    <span><span class="legend-dot root">${scale.root}</span> Root note</span>
                    <span><span class="legend-dot scale">●</span> Scale note</span>
                </div>
            </div>
        `;
    }

    getScaleNotes(scale) {
        const notes = {};
        scale.formula.forEach((interval) => {
            const noteValue = (scale.rootValue + interval) % 12;
            notes[noteValue] = true;
        });
        return notes;
    }

    generateFretNumbers(startFret, count) {
        let numbers = '';
        for (let i = 0; i < count; i++) {
            const fretNum = startFret + i;
            numbers += `<div class="fret-num">${fretNum || ''}</div>`;
        }
        return numbers;
    }

    generateFretboard(scale, scaleNotes) {
        let fretboard = '';
        const fretCount = scale.fretEnd - scale.fretStart + 1;

        // Generate each string
        this.strings.forEach((string, stringIndex) => {
            fretboard += '<div class="string-row">';

            const stringKey = stringIndex === 5 ? 'E_low' : string;
            const openNoteValue = this.openStringValues[stringKey];

            // Generate each fret
            for (let fret = scale.fretStart; fret <= scale.fretEnd; fret++) {
                const noteValue = (openNoteValue + fret) % 12;
                const noteName = this.noteNames[noteValue];
                const isInScale = scaleNotes[noteValue];
                const isRoot = noteName === scale.root;

                let cellClass = 'fret-cell-notes';
                if (fret === 0) cellClass += ' open';

                fretboard += `<div class="${cellClass}">`;

                if (isInScale) {
                    const noteClass = isRoot ? 'note-circle root' : 'note-circle scale';
                    fretboard += `<div class="${noteClass}">${noteName}</div>`;
                }

                fretboard += '</div>';
            }

            fretboard += '</div>';
        });

        return fretboard;
    }
}

export default FretboardWithNotes;
