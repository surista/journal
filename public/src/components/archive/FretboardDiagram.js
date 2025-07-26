// Fretboard Diagram Component for displaying scales and chord shapes

class FretboardDiagram {
    constructor() {
        this.strings = ['E', 'B', 'G', 'D', 'A', 'E']; // High to low
        this.frets = 12;

        // Note positions for scales (fret numbers on each string)
        this.scales = {
            // Major scale - C Major in 1st position
            major: {
                title: 'C Major Scale - 1st Position',
                key: 'C',
                formula: '1 - 2 - 3 - 4 - 5 - 6 - 7',
                notes: {
                    E: [0, 1, 3], // E, F, G
                    B: [0, 1, 3], // B, C, D
                    G: [0, 2], // G, A
                    D: [0, 2, 3], // D, E, F
                    A: [0, 2, 3], // A, B, C
                    E_low: [0, 1, 3] // E, F, G
                },
                roots: ['C'] // Root notes
            },

            // Major Pentatonic - C Major Pentatonic in 1st position
            majorPentatonic: {
                title: 'C Major Pentatonic - 1st Position',
                key: 'C',
                formula: '1 - 2 - 3 - 5 - 6',
                notes: {
                    E: [0, 3], // E, G
                    B: [1, 3], // C, D
                    G: [0, 2], // G, A
                    D: [0, 2], // D, E
                    A: [0, 3], // A, C
                    E_low: [0, 3] // E, G
                },
                roots: ['C']
            },

            // Natural Minor scale - A Minor in 1st position
            minor: {
                title: 'A Natural Minor Scale - 1st Position',
                key: 'Am',
                formula: '1 - 2 - ♭3 - 4 - 5 - ♭6 - ♭7',
                notes: {
                    E: [0, 1, 3], // E, F, G
                    B: [0, 1, 3], // B, C, D
                    G: [0, 2], // G, A
                    D: [0, 2, 3], // D, E, F
                    A: [0, 2, 3], // A, B, C
                    E_low: [0, 1, 3] // E, F, G
                },
                roots: ['A']
            },

            // Minor Pentatonic - A Minor Pentatonic in 1st position
            minorPentatonic: {
                title: 'A Minor Pentatonic - 1st Position',
                key: 'Am',
                formula: '1 - ♭3 - 4 - 5 - ♭7',
                notes: {
                    E: [0, 3], // E, G
                    B: [1, 3], // C, D
                    G: [0, 2], // G, A
                    D: [0, 2], // D, E
                    A: [0, 3], // A, C
                    E_low: [0, 3] // E, G
                },
                roots: ['A']
            }
        };

        this.noteNames = {
            C: { E: 8, B: 1, G: 5, D: 10, A: 3, E_low: 8 },
            A: { E: 5, B: 10, G: 2, D: 7, A: 0, E_low: 5 },
            E: { E: 0, B: 5, G: 9, D: 2, A: 7, E_low: 0 },
            G: { E: 3, B: 8, G: 0, D: 5, A: 10, E_low: 3 },
            D: { E: 10, B: 3, G: 7, D: 0, A: 5, E_low: 10 },
            F: { E: 1, B: 6, G: 10, D: 3, A: 8, E_low: 1 },
            B: { E: 7, B: 0, G: 4, D: 9, A: 2, E_low: 7 }
        };
    }

    generateDiagram(scaleType) {
        const scale = this.scales[scaleType];
        if (!scale) return '';

        const html = `
            <div class="fretboard-diagram">
                <h3 class="fretboard-title">${scale.title}</h3>
                <div class="fretboard-container">
                    <div class="fretboard">
                        ${this.generateStringLabels()}
                        ${this.generateFretboard(scale)}
                    </div>
                    ${this.generateFretNumbers()}
                </div>
                ${this.generateLegend(scaleType)}
                <div class="scale-info">
                    <strong>Key:</strong> ${scale.key}<br>
                    <strong>Formula:</strong> <span class="scale-formula">${scale.formula}</span>
                </div>
            </div>
        `;

        return html;
    }

    generateStringLabels() {
        let labels = '<div class="string-label"></div>'; // Empty corner
        this.strings.forEach((string, index) => {
            const displayString = index === 5 ? string : string; // Both E strings
            labels += `<div class="string-label">${displayString}</div>`;
        });
        return labels;
    }

    generateFretboard(scale) {
        let fretboard = '';

        // Generate fret numbers row
        for (let fret = 0; fret <= this.frets; fret++) {
            if (fret === 0) {
                fretboard += '<div class="string-area"></div>';
            } else {
                const hasMarker = [3, 5, 7, 9, 12].includes(fret);
                const doubleMarker = fret === 12;
                fretboard += `<div class="fret">
                    ${hasMarker && !doubleMarker ? '<div class="fret-marker"></div>' : ''}
                    ${doubleMarker ? '<div class="fret-marker" style="top: 35%;"></div><div class="fret-marker" style="top: 65%;"></div>' : ''}
                </div>`;
            }
        }

        // Generate strings with notes
        this.strings.forEach((string, stringIndex) => {
            const stringKey = stringIndex === 5 ? 'E_low' : string;
            const stringNotes = scale.notes[stringKey] || [];

            for (let fret = 0; fret <= this.frets; fret++) {
                let content = '';

                if (stringNotes.includes(fret)) {
                    const isRoot = this.isRootNote(scale, stringKey, fret);
                    const noteClass = isRoot ? 'root' : 'scale';
                    const noteLabel = isRoot ? scale.roots[0] : '';

                    content = `<div class="note ${noteClass}">${noteLabel}</div>`;
                }

                if (fret === 0) {
                    // Special handling for nut position
                    fretboard += `<div class="fret nut">${content}</div>`;
                } else {
                    fretboard += `<div class="fret">${content}</div>`;
                }
            }
        });

        return fretboard;
    }

    generateFretNumbers() {
        let numbers =
            '<div class="fret-numbers" style="display: grid; grid-template-columns: 50px repeat(12, 1fr); margin-top: 10px;">';
        numbers += '<div></div>'; // Empty space for string labels

        for (let fret = 1; fret <= this.frets; fret++) {
            if ([3, 5, 7, 9, 12].includes(fret)) {
                numbers += `<div class="fret-number">${fret}</div>`;
            } else {
                numbers += '<div></div>';
            }
        }

        numbers += '</div>';
        return numbers;
    }

    generateLegend(scaleType) {
        const isPentatonic = scaleType.includes('Pentatonic');

        return `
            <div class="fretboard-legend">
                <div class="legend-item">
                    <div class="legend-dot root"></div>
                    <span>Root Note</span>
                </div>
                <div class="legend-item">
                    <div class="legend-dot scale"></div>
                    <span>${isPentatonic ? 'Pentatonic Note' : 'Scale Note'}</span>
                </div>
            </div>
        `;
    }

    isRootNote(scale, string, fret) {
        // Check if this position is a root note
        const rootPositions = this.noteNames[scale.roots[0]];
        if (!rootPositions) return false;

        const rootFret = rootPositions[string];
        return fret === rootFret || rootFret + 12 === fret;
    }

    // Generate HTML for multiple scale diagrams
    generateComparisonDiagrams() {
        return `
            <div class="scale-comparison">
                <h2>Scale Comparison - 1st Position</h2>
                <p>Compare the major and minor scales with their pentatonic versions. Notice how the pentatonic scales are simplified versions with fewer notes.</p>
                
                ${this.generateDiagram('major')}
                ${this.generateDiagram('majorPentatonic')}
                ${this.generateDiagram('minor')}
                ${this.generateDiagram('minorPentatonic')}
            </div>
        `;
    }
}

export default FretboardDiagram;
