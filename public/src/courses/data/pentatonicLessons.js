// Comprehensive Pentatonic Scale Lessons Data
export const pentatonicLessons = [
    {
        id: 'intro-pentatonic',
        title: 'Introduction to the Pentatonic Scale',
        description: 'Learn what the pentatonic scale is and how it relates to the major scale',
        type: 'theory',
        requiresPrevious: false,
        content: {
            sections: [
                {
                    type: 'hero',
                    title: 'The Pentatonic Scale',
                    subtitle: 'Your Gateway to Guitar Soloing',
                    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1200&h=600&fit=crop'
                },
                {
                    type: 'text',
                    content: `# Welcome to the World of Pentatonic Scales

The pentatonic scale is arguably the most important scale you'll ever learn on guitar. From blues legends like B.B. King to rock gods like Jimmy Page, virtually every great guitarist has mastered this scale.

## What is the Pentatonic Scale?

The word "pentatonic" comes from the Greek words "penta" (five) and "tonic" (tone), meaning it's a five-note scale. This is what makes it so special - by removing two notes from the standard seven-note scales, we're left with only the most consonant, pleasant-sounding intervals.`
                },
                {
                    type: 'image',
                    url: 'https://via.placeholder.com/800x300/f8f8f8/333333?text=C+Major+Scale+-+Open+Position',
                    caption: 'C Major Scale - Open Position (frets 0-3)',
                    alt: 'C Major Scale fretboard diagram'
                },
                {
                    type: 'image',
                    url: 'https://via.placeholder.com/800x300/f8f8f8/333333?text=C+Major+Pentatonic+Scale+-+Open+Position',
                    caption: 'C Major Pentatonic Scale - Open Position (frets 0-3)',
                    alt: 'C Major Pentatonic Scale fretboard diagram'
                },
                {
                    type: 'text',
                    content: `## The Two Types of Pentatonic Scales

There are two main pentatonic scales you need to know:

### 1. Major Pentatonic Scale
- Formula: 1 - 2 - 3 - 5 - 6
- Derived from the major scale by removing the 4th and 7th degrees
- Sounds happy, uplifting, country-ish

### 2. Minor Pentatonic Scale
- Formula: 1 - ♭3 - 4 - 5 - ♭7
- Derived from the natural minor scale by removing the 2nd and 6th degrees
- Sounds bluesy, rock-oriented, slightly dark`
                },
                {
                    type: 'image',
                    url: 'https://via.placeholder.com/800x300/f8f8f8/333333?text=A+Natural+Minor+Scale+-+Open+Position',
                    caption: 'A Natural Minor Scale - Open Position (frets 0-3)',
                    alt: 'A Natural Minor Scale fretboard diagram'
                },
                {
                    type: 'image',
                    url: 'https://via.placeholder.com/800x300/f8f8f8/333333?text=A+Minor+Pentatonic+Scale+-+Open+Position',
                    caption: 'A Minor Pentatonic Scale - Open Position (frets 0-3)',
                    alt: 'A Minor Pentatonic Scale fretboard diagram'
                },
                {
                    type: 'interactive',
                    component: 'scale-diagram',
                    data: {
                        scale: 'A minor pentatonic',
                        positions: [5, 8],
                        showDegrees: true
                    }
                },
                {
                    type: 'text',
                    content: `## Why Learn the Pentatonic Scale First?

### 1. Simplicity
With only 5 notes instead of 7, patterns are easier to memorize and visualize on the fretboard.

### 2. No Wrong Notes
The pentatonic scale omits the notes that can sound dissonant or require careful resolution. This means you can play any note at any time and it will sound good!

### 3. Universal Application
These scales work over countless chord progressions and in virtually every musical style.

### 4. Foundation for Advanced Techniques
Once you master pentatonic scales, adding the "missing" notes to create full scales becomes much easier.`
                },
                {
                    type: 'callout',
                    style: 'tip',
                    content: `**Pro Tip:** The minor pentatonic scale is the same as the major pentatonic scale, just starting from a different note. A minor pentatonic uses the same notes as C major pentatonic!`
                },
                {
                    type: 'text',
                    content: `## Famous Songs Using Pentatonic Scales

Here are some iconic songs that heavily feature pentatonic scales:

- **"Stairway to Heaven" - Led Zeppelin** (A minor pentatonic)
- **"Sweet Home Alabama" - Lynyrd Skynyrd** (D major pentatonic)
- **"Black Dog" - Led Zeppelin** (E minor pentatonic)
- **"My Girl" - The Temptations** (C major pentatonic)
- **"Sunshine of Your Love" - Cream** (D minor pentatonic)`
                },
                {
                    type: 'video',
                    embedId: 'dQw4w9WgXcQ', // Placeholder - would be actual lesson video
                    title: 'Pentatonic Scale Overview',
                    duration: '5:32'
                },
                {
                    type: 'text',
                    content: `## Your Journey Ahead

In this course, you'll learn:

1. **All 5 positions** of the pentatonic scale
2. **How to connect** these positions across the fretboard
3. **Essential techniques** like bending, vibrato, and slides
4. **Classic licks and phrases** used by the masters
5. **How to create your own solos** using these scales

By the end, you'll be able to play fluid, musical solos in any key!`
                },
                {
                    type: 'practice',
                    title: 'Lesson Summary',
                    points: [
                        'The pentatonic scale has 5 notes instead of 7',
                        'There are major and minor pentatonic scales',
                        'These scales are used in virtually all popular music',
                        'They\'re easier to learn and sound great immediately'
                    ]
                }
            ]
        },
        goals: []
    },
    {
        id: 'shape-1-practice',
        title: 'Pentatonic Shape 1 - The Foundation',
        description: 'Master the first pentatonic shape with exercises and technique',
        type: 'practice',
        requiresPrevious: true,
        content: {
            sections: [
                {
                    type: 'hero',
                    title: 'Shape 1 - The Foundation',
                    subtitle: 'Master Your First Pentatonic Position',
                    image: 'https://via.placeholder.com/800x400/e74c3c/ffffff?text=Pentatonic+Shape+1'
                },
                {
                    type: 'text',
                    content: `# Pentatonic Shape 1 (Box 1)

This is the most important pentatonic shape you'll ever learn. Often called "Box 1" or "Position 1," this shape is the foundation for blues and rock soloing. Once you master this shape, you'll be able to play basic solos in any key!`
                },
                {
                    type: 'image',
                    url: 'https://via.placeholder.com/800x400/f8f8f8/333333?text=A+Minor+Pentatonic+-+Box+1+(5th+Position)',
                    caption: 'A Minor Pentatonic - Box 1 at the 5th fret',
                    alt: 'Fretboard diagram showing pentatonic box 1 pattern'
                },
                {
                    type: 'tab',
                    content: `A Minor Pentatonic - Shape 1 (5th fret)
e|---------------------------5-8-
B|-----------------------5-8-----
G|-------------------5-7---------
D|---------------5-7-------------
A|-----------5-7-----------------
E|-------5-8---------------------

Root notes (A) are at:
- 6th string, 5th fret
- 4th string, 7th fret
- 1st string, 5th fret`,
                    title: 'The Basic Pattern'
                },
                {
                    type: 'text',
                    content: `## Understanding the Shape

### Key Points:
1. **Root Notes**: The shape contains 3 root notes (A in this case)
2. **Finger Placement**: Use your index finger for 5th fret, ring finger for 7th fret, pinky for 8th fret
3. **Pattern**: The shape uses only 2 or 3 frets per string
4. **Symmetry**: Notice how the pattern is similar on string pairs`
                },
                {
                    type: 'callout',
                    style: 'important',
                    content: `**Critical Concept:** This shape is MOVABLE! Play it at the 5th fret for A minor pentatonic, 3rd fret for G minor pentatonic, 8th fret for C minor pentatonic, etc.`
                },
                {
                    type: 'text',
                    content: `## Technique Focus

### 1. Alternate Picking
Alternate between downstrokes and upstrokes for efficiency and speed.

### 2. Finger Positioning
- Keep fingers curved
- Press just behind the frets
- Use fingertips, not pads

### 3. Hand Position
- Thumb behind neck
- Wrist straight
- Minimal movement`
                },
                {
                    type: 'exercise',
                    title: 'Exercise 1: Ascending and Descending',
                    content: {
                        description: 'Play the scale up and down slowly and evenly',
                        tab: `Ascending:
E|-------5-8---------------------
A|-----------5-7-----------------
D|---------------5-7-------------
G|-------------------5-7---------
B|-----------------------5-8-----
e|---------------------------5-8-

Descending:
e|---------------------------8-5-
B|-----------------------8-5-----
G|-------------------7-5---------
D|---------------7-5-------------
A|-----------7-5-----------------
E|-------8-5---------------------`,
                        tempo: 'Start at 60 BPM, increase by 10 BPM when comfortable',
                        focus: 'Even timing, clean notes, alternate picking'
                    }
                },
                {
                    type: 'exercise',
                    title: 'Exercise 2: String Pairs',
                    content: {
                        description: 'Practice moving between adjacent strings',
                        tab: `Pattern 1: Low E and A strings
E|-------5-8-5-8-5-8-------------
A|-----------5-7-5-7-5-7---------
D|-------------------------------
G|-------------------------------
B|-------------------------------
e|-------------------------------

Pattern 2: D and G strings
E|-------------------------------
A|-------------------------------
D|-------5-7-5-7-5-7-------------
G|-----------5-7-5-7-5-7---------
B|-------------------------------
e|-------------------------------`,
                        tempo: 'Start at 70 BPM',
                        focus: 'Smooth string transitions'
                    }
                },
                {
                    type: 'exercise',
                    title: 'Exercise 3: Triplet Patterns',
                    content: {
                        description: 'Play in groups of three for a blues feel',
                        tab: `Triplet pattern (count: 1-trip-let, 2-trip-let, etc.)
E|-------5-8-5-8-5-8-------------
A|-------------------5-7-5-7-5-7-
D|-------------------------------
(Continue pattern through all strings)`,
                        tempo: 'Start at 60 BPM',
                        focus: 'Keep triplets even, accent the first note of each group'
                    }
                },
                {
                    type: 'image',
                    url: 'https://via.placeholder.com/600x300/27ae60/ffffff?text=Common+Fingering+Mistakes',
                    caption: 'Avoid these common fingering mistakes',
                    alt: 'Diagram showing correct vs incorrect finger positions'
                },
                {
                    type: 'text',
                    content: `## Building Muscle Memory

### Daily Practice Routine (15 minutes)
1. **Warm-up** (2 min): Play shape slowly, focus on clean notes
2. **Ascending/Descending** (3 min): Full scale up and down
3. **String Pairs** (3 min): Practice 2-string combinations
4. **Triplets** (3 min): Work on rhythm and timing
5. **Free Play** (4 min): Experiment with the notes

### Tips for Success
- Start SLOW - speed comes with accuracy
- Use a metronome always
- Record yourself to check timing
- Practice in different keys (move the shape!)
- Focus on tone quality, not just speed`
                },
                {
                    type: 'callout',
                    style: 'tip',
                    content: `**Practice Hack:** Play along with backing tracks in A minor. Even simple noodling within this shape will sound musical!`
                },
                {
                    type: 'backing-track',
                    title: 'A Minor Blues Backing Track',
                    key: 'A minor',
                    tempo: 90,
                    style: 'Slow Blues',
                    duration: '3:00'
                }
            ]
        },
        goals: [
            {
                id: 'shape1-clean',
                description: 'Play Shape 1 cleanly without mistakes',
                type: 'metronome',
                bpm: 60,
                duration: 60,
                required: true
            },
            {
                id: 'shape1-ascending',
                description: 'Play Shape 1 ascending at moderate tempo',
                type: 'metronome',
                bpm: 80,
                duration: 45,
                required: true
            },
            {
                id: 'shape1-descending',
                description: 'Play Shape 1 descending at moderate tempo',
                type: 'metronome',
                bpm: 80,
                duration: 45,
                required: true
            },
            {
                id: 'shape1-triplets',
                description: 'Play Shape 1 in triplets',
                type: 'metronome',
                bpm: 70,
                duration: 60,
                required: false
            }
        ]
    },
    {
        id: 'pattern-sequences',
        title: 'Essential Pentatonic Patterns',
        description: 'Learn sequences and patterns that create musical phrases',
        type: 'practice',
        requiresPrevious: true,
        content: {
            sections: [
                {
                    type: 'hero',
                    title: 'Pattern Sequences',
                    subtitle: 'Transform Scales into Music',
                    image: 'https://via.placeholder.com/800x400/9b59b6/ffffff?text=Pentatonic+Patterns'
                },
                {
                    type: 'text',
                    content: `# Beyond Playing Up and Down

Now that you've mastered Shape 1, it's time to make it musical! Playing scales straight up and down sounds like... well, scales. But by organizing the notes into patterns and sequences, you'll create actual musical phrases that sound like real solos.`
                },
                {
                    type: 'text',
                    content: `## What Are Sequences?

A sequence is a melodic pattern that repeats at different pitch levels. Instead of playing:
- 1, 2, 3, 4, 5, 6, 7, 8...

You might play:
- 1-2-3, 2-3-4, 3-4-5, 4-5-6...

This creates movement and interest in your playing!`
                },
                {
                    type: 'tab',
                    content: `Pattern 1: Groups of 3 (Ascending)
E|-------5-8-5-------------------
A|-----------8-5-7-5-------------
D|-------------------7-5-7-------
G|-------------------------5-7-5-
B|-------------------------------
e|-------------------------------

Play each group of 3, then start the next group 
from the 2nd note of the previous group`,
                    title: 'Three-Note Sequences'
                },
                {
                    type: 'exercise',
                    title: 'Exercise 1: Ascending Threes',
                    content: {
                        description: 'Master the ascending three-note sequence',
                        tab: `Full pattern through Shape 1:
E|-------5-8-5-------------------
A|-----------8-5-7-5-7-----------
D|---------------------5-7-5-7---
G|-----------------------------5-
B|-------------------------------
e|-------------------------------

Then continue:
G|-----------------------------5-
B|---------------------------7-5-
e|-----7-5-8-5-8-----------------`,
                        tempo: 'Start at 70 BPM',
                        focus: 'Keep groups of 3 clear and distinct'
                    }
                },
                {
                    type: 'tab',
                    content: `Pattern 2: Groups of 4 (Ascending)
E|-------5-8-5-8-----------------
A|---------------5-7-5-7---------
D|-----------------------5-7-5-7-
G|-------------------------------
B|-------------------------------
e|-------------------------------`,
                    title: 'Four-Note Sequences'
                },
                {
                    type: 'text',
                    content: `## Advanced Patterns

### The "Stairway" Pattern
Made famous by Jimmy Page, this creates a cascading effect:`
                },
                {
                    type: 'tab',
                    content: `The Stairway Pattern:
e|---5-------5-------5-----------
B|-----8-5-----8-5-----8-5-------
G|---------7-------7-------7-5---
D|-----------------------------7-
A|-------------------------------
E|-------------------------------

This creates a descending cascade effect`,
                    title: 'Classic Cascade'
                },
                {
                    type: 'exercise',
                    title: 'Exercise 2: The Blues Sequence',
                    content: {
                        description: 'A must-know blues pattern',
                        tab: `Classic Blues Sequence:
E|-------5---8-5-----------------
A|---------8-----8-5-7-5---------
D|-----------------------7-5-7-5-
G|-------------------------------
B|-------------------------------
e|-------------------------------

Variation with bends:
E|-------5---8b10-8-5------------
A|---------8----------8-5-7b9-7-5
D|-------------------------------`,
                        tempo: 'Start at 60 BPM',
                        focus: 'Add slight bends for blues feel'
                    }
                },
                {
                    type: 'text',
                    content: `## Creating Musical Phrases

### Combining Patterns
The key to great solos is combining different patterns smoothly. Here's how:

1. **Start with a simple pattern** (like ascending 3s)
2. **Transition to another** (like the cascade)
3. **End with a strong note** (usually the root)

### Adding Dynamics
- Play some notes louder/softer
- Use hammer-ons and pull-offs
- Add vibrato to held notes
- Leave space - silence is powerful!`
                },
                {
                    type: 'tab',
                    content: `Combined Phrase Example:
(Ascending 3s)
E|-------5-8-5-------------------
A|-----------8-5-7-5-------------
(Transition to cascade)
B|-------------------8-5---------
G|-----------------------7-5-----
(End on root)
D|---------------------------7~~~

~ = add vibrato`,
                    title: 'Complete Musical Phrase'
                },
                {
                    type: 'callout',
                    style: 'tip',
                    content: `**Pro Tip:** Great players don't just play patterns - they SING through their guitar. Try humming a melody, then find those notes within the pentatonic shape!`
                },
                {
                    type: 'text',
                    content: `## Rhythm Variations

Don't just play straight eighth notes! Mix it up:

### Rhythmic Ideas:
- **Triplets**: Three notes per beat (blues feel)
- **Sixteenth notes**: Four notes per beat (fast runs)
- **Syncopation**: Emphasize off-beats
- **Long/Short**: Mix held notes with quick runs`
                },
                {
                    type: 'exercise',
                    title: 'Exercise 3: Rhythm Practice',
                    content: {
                        description: 'Same notes, different rhythms',
                        tab: `Pattern played 4 different ways:

1. Straight eighths:
E|-------5-8-5-8-5-8-------------

2. Triplets:
E|-------5-8-5-8-5-8------------- (play as triplets)

3. Syncopated:
E|-------5---8-5---8---5-8------- (emphasize off-beats)

4. Mixed:
E|-------5~~~~~~~8-5-8-5--------- (hold first note)`,
                        tempo: 'Start at 80 BPM',
                        focus: 'Make each rhythm feel different'
                    }
                },
                {
                    type: 'backing-track',
                    title: 'Pattern Practice Backing Track',
                    key: 'A minor',
                    tempo: 100,
                    style: 'Rock',
                    duration: '4:00'
                },
                {
                    type: 'text',
                    content: `## Your Practice Routine

### 10-Minute Pattern Workout:
1. **Warm-up** (2 min): Play Shape 1 straight
2. **3-note sequences** (2 min): Up and down
3. **4-note sequences** (2 min): Up and down  
4. **Cascade pattern** (2 min): Focus on flow
5. **Create phrases** (2 min): Combine patterns

### Remember:
- Patterns are tools, not rules
- Mix and match to create your own style
- Listen to your favorite solos - identify the patterns
- Practice with backing tracks always!`
                }
            ]
        },
        goals: [
            {
                id: 'pattern-3s',
                description: 'Play 3-note sequences cleanly',
                type: 'metronome',
                bpm: 80,
                duration: 90,
                required: true
            },
            {
                id: 'pattern-4s',
                description: 'Play 4-note sequences smoothly',
                type: 'metronome',
                bpm: 70,
                duration: 90,
                required: true
            },
            {
                id: 'cascade-pattern',
                description: 'Master the cascade pattern',
                type: 'metronome',
                bpm: 60,
                duration: 60,
                required: true
            },
            {
                id: 'combine-patterns',
                description: 'Create a 16-bar solo using patterns',
                type: 'backing-track',
                bpm: 90,
                duration: 120,
                required: false
            }
        ]
    },
    {
        id: 'famous-licks',
        title: 'Classic Pentatonic Licks',
        description: 'Learn famous licks from legendary guitar solos',
        type: 'practice',
        requiresPrevious: true,
        content: {
            sections: [
                {
                    type: 'hero',
                    title: 'Famous Pentatonic Licks',
                    subtitle: 'Stand on the Shoulders of Giants',
                    image: 'https://via.placeholder.com/800x400/e67e22/ffffff?text=Classic+Guitar+Licks'
                },
                {
                    type: 'text',
                    content: `# Learn from the Masters

Every great guitarist has contributed licks and phrases that have become part of the guitar vocabulary. These licks are like words in a language - learn enough of them, and you'll be able to "speak" fluently in any musical conversation.

In this lesson, we'll learn iconic licks that have shaped rock and blues guitar!`
                },
                {
                    type: 'text',
                    content: `## Lick 1: The BB King Box

B.B. King was the master of saying more with less. This simple but effective lick demonstrates his "less is more" philosophy:`
                },
                {
                    type: 'tab',
                    content: `The BB King Box (A minor pentatonic):
e|-------8b10r8--5---------------
B|-----------------8-5-----------
G|---------------------7b9r7-5---
D|-----------------------------7-
A|-------------------------------
E|-------------------------------

b = bend (8b10 = bend 8th fret up to sound like 10th)
r = release bend
~ = vibrato

Play with feeling, not speed!`,
                    title: 'BB King Signature Lick'
                },
                {
                    type: 'callout',
                    style: 'tip',
                    content: `**Performance Tip:** B.B. King's secret was his vibrato. Practice adding a singing vibrato to every held note. Move your whole hand, not just your finger!`
                },
                {
                    type: 'text',
                    content: `## Lick 2: The Clapton Classic

Eric Clapton's "Crossroads" solo contains this must-know lick that combines bending with rapid-fire notes:`
                },
                {
                    type: 'tab',
                    content: `Clapton's Crossroads Lick:
e|-------------------------------
B|-------5-8-5-8b10r8-5----------
G|---5-7----------------7-5-7----
D|-7-----------------------------
A|-------------------------------
E|-------------------------------

Play aggressively with slight palm muting
Focus on the bend timing - it's crucial!`,
                    title: 'Crossroads Lick'
                },
                {
                    type: 'exercise',
                    title: 'Lick Practice Method',
                    content: {
                        description: 'How to master any lick',
                        steps: [
                            '1. Play it SLOWLY - half speed or less',
                            '2. Focus on exact timing and articulation',
                            '3. Gradually increase tempo (10 BPM at a time)',
                            '4. Play along with the original recording',
                            '5. Practice in different keys'
                        ]
                    }
                },
                {
                    type: 'text',
                    content: `## Lick 3: The Page Cascade

Jimmy Page's solo in "Stairway to Heaven" features this beautiful descending pattern that's become one of the most famous licks in rock:`
                },
                {
                    type: 'tab',
                    content: `Stairway to Heaven Lick:
e|---8-5-----5-------------------
B|-------8-5---8-5---------------
G|-----------------7-5-----------
D|---------------------7-5-------
A|-------------------------7-5-3-
E|-------------------------------

Let notes ring together where possible
This creates a cascading, harp-like effect`,
                    title: 'Stairway Cascade'
                },
                {
                    type: 'text',
                    content: `## Lick 4: The Hendrix Hammer

Jimi Hendrix revolutionized pentatonic playing by adding hammer-ons, pull-offs, and his signature aggression:`
                },
                {
                    type: 'tab',
                    content: `Hendrix-Style Lick:
e|-------5h8p5---5---------------
B|-------------8---8-5h6p5-------
G|-------------------------7b9---
D|-------------------------------
A|-------------------------------
E|-------------------------------

h = hammer-on
p = pull-off
Play with attitude!`,
                    title: 'Hendrix Hammer'
                },
                {
                    type: 'callout',
                    style: 'important',
                    content: `**Key Insight:** Notice how all these licks use the SAME NOTES from Shape 1, but each sounds completely different. It's not about the notes - it's about HOW you play them!`
                },
                {
                    type: 'text',
                    content: `## Lick 5: The Gilmour Bend

David Gilmour is famous for his emotional bends. This lick from "Another Brick in the Wall" demonstrates his mastery:`
                },
                {
                    type: 'tab',
                    content: `Gilmour-Style Emotional Bend:
e|-------------------------------
B|-------5~~~~~-8b10=======10r8-5
G|---5-7-------------------------
D|-7-----------------------------
A|-------------------------------
E|-------------------------------

= : hold the bend
~~~~~ : wide vibrato
The bend should cry!`,
                    title: 'Gilmour Bend'
                },
                {
                    type: 'text',
                    content: `## Building Your Lick Vocabulary

### How to Learn Licks Effectively:

1. **Transcribe by Ear**: Try to figure out licks yourself first
2. **Analyze the Rhythm**: Often more important than the notes
3. **Understand the Context**: When and why was the lick played?
4. **Make It Yours**: Change a note or two to personalize it

### Practice Routine:
- Learn one new lick per week
- Practice it in all 12 keys
- Try it over different chord progressions
- Combine it with licks you already know`
                },
                {
                    type: 'exercise',
                    title: 'Lick Combination Exercise',
                    content: {
                        description: 'Create a solo using the licks learned',
                        tab: `Example combination:
(Start with BB King)
e|-------8b10r8--5---------------
B|-----------------8-5-----------
(Transition to Clapton)
B|-----------5-8-5-8b10r8-5------
G|-------5-7----------------7-5--
(End with Gilmour bend)
B|---5~~~~~-8b10=======10r8-5----
G|-7-----------------------------`,
                        challenge: 'Create your own combinations!'
                    }
                },
                {
                    type: 'text',
                    content: `## Advanced Techniques

### Bending Accuracy
- Always bend UP to a specific note
- Check your bend pitch against the fretted note
- Practice 1/4, 1/2, full, and 1.5 step bends

### Vibrato Styles
- **BB King**: Wide and slow
- **Clapton**: Moderate and controlled  
- **Gilmour**: Slow and emotional
- **Zakk Wylde**: Fast and aggressive

### Timing Variations
- Play licks ahead of the beat (rushing)
- Play behind the beat (laid back)
- Mix both for dynamic feel`
                },
                {
                    type: 'backing-track',
                    title: 'Lick Practice Backing Track',
                    key: 'A minor',
                    tempo: 75,
                    style: 'Blues Rock',
                    duration: '5:00'
                },
                {
                    type: 'text',
                    content: `## Creating Your Own Licks

Now that you've learned these classic licks, it's time to create your own:

### Lick Creation Formula:
1. **Start with a familiar pattern**
2. **Add a technique** (bend, slide, hammer-on)
3. **Create tension** (pause, hold a note)
4. **Resolve to root** (or another strong note)

### Remember:
- Great licks are memorable
- They often have a "question and answer" feel
- Rhythm is as important as note choice
- Space and silence add power

### Your Assignment:
Create 3 original licks using Shape 1. Record them and practice until they feel natural!`
                }
            ]
        },
        goals: [
            {
                id: 'bb-king-lick',
                description: 'Master the BB King lick with proper bends',
                type: 'metronome',
                bpm: 60,
                duration: 60,
                required: true
            },
            {
                id: 'clapton-lick',
                description: 'Play the Clapton lick at tempo',
                type: 'metronome',
                bpm: 100,
                duration: 60,
                required: true
            },
            {
                id: 'page-cascade',
                description: 'Perform the Page cascade smoothly',
                type: 'metronome',
                bpm: 70,
                duration: 60,
                required: true
            },
            {
                id: 'create-lick',
                description: 'Create and perform your own 4-bar lick',
                type: 'freestyle',
                duration: 120,
                required: true
            },
            {
                id: 'full-solo',
                description: 'Perform a 12-bar solo using learned licks',
                type: 'backing-track',
                bpm: 80,
                duration: 180,
                required: false
            }
        ]
    }
];

export default pentatonicLessons;