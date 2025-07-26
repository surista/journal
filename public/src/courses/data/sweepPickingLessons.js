// Comprehensive Sweep Picking Course
export const sweepPickingLessons = [
    {
        id: 'sweep-intro',
        title: 'Introduction to Sweep Picking',
        description: 'Master the fundamentals of sweep picking technique',
        type: 'technique',
        requiresPrevious: false,
        content: {
            sections: [
                {
                    type: 'hero',
                    title: 'Sweep Picking Mastery',
                    subtitle: 'Unlock the Secret to Lightning-Fast Arpeggios',
                    image: 'https://images.unsplash.com/photo-1565098772267-60af42b81ef2?w=1200&h=600&fit=crop'
                },
                {
                    type: 'text',
                    content: `# What is Sweep Picking?

Sweep picking is an advanced guitar technique that allows you to play arpeggios and broken chords with incredible speed and fluidity. Instead of alternate picking each note, you "sweep" the pick across the strings in one continuous motion, like a controlled strum.

## Why Learn Sweep Picking?

- **Speed**: Play arpeggios much faster than with alternate picking
- **Fluidity**: Create smooth, flowing musical lines
- **Efficiency**: Less pick movement = less effort
- **Professional Sound**: Used by virtuosos like Yngwie Malmsteen, Jason Becker, and Frank Gambale`
                },
                {
                    type: 'image',
                    url: 'https://via.placeholder.com/800x400/f8f8f8/333333?text=Sweep+Picking+Hand+Position',
                    caption: 'Proper hand position for sweep picking',
                    alt: 'Diagram showing correct pick angle and hand position'
                },
                {
                    type: 'text',
                    content: `## The Basic Mechanics

### 1. Pick Motion
- **Downward sweep**: Push through strings with a slight angle
- **Upward sweep**: Pull through strings smoothly
- **Important**: One continuous motion, NOT individual picks

### 2. Left Hand Technique
- **Roll** fingers to avoid multiple notes ringing
- **Precise** timing - lift fingers immediately after playing
- **Light** touch - just enough pressure to sound the note

### 3. Synchronization
The key to clean sweep picking is perfect synchronization between both hands. Start SLOW!`
                },
                {
                    type: 'callout',
                    style: 'warning',
                    content: `**Common Mistake**: Trying to go fast too soon! Sweep picking is about controlled motion, not speed. Speed comes naturally with proper technique.`
                },
                {
                    type: 'exercise',
                    title: 'Exercise 1: Basic 3-String Sweep',
                    content: {
                        description: 'Your first sweep pattern - A minor arpeggio',
                        tab: `Basic A minor sweep (3 strings):
e|-------12----------------------
B|----13----13-------------------
G|-14----------14----------------
D|-----------------(return)------

Down sweep: Push through G→B→e
Up sweep: Pull through e→B→G

Count: 1 - 2 - 3 - 3 - 2 - 1`,
                        tempo: 'Start at 40 BPM - Yes, that slow!',
                        focus: 'Clean notes, no string noise',
                        steps: [
                            'Play each note individually first',
                            'Practice the down sweep motion without fretting',
                            'Add left hand, one note at a time',
                            'Focus on lifting fingers to stop notes ringing',
                            'Gradually connect the motion'
                        ]
                    }
                },
                {
                    type: 'exercise',
                    title: 'Exercise 2: Pick Motion Drill',
                    content: {
                        description: 'Develop the sweeping motion without fretting',
                        tab: `Muted string exercise:
e|-x-x-x-x-----------------------
B|-x-x-x-x-----------------------
G|-x-x-x-x-----------------------
D|-x-x-x-x-----------------------

Mute strings with left hand
Practice smooth down/up sweeps
Listen for even timing`,
                        tempo: 'Start at 60 BPM',
                        focus: 'Smooth, continuous pick motion'
                    }
                },
                {
                    type: 'video',
                    embedId: 'placeholder-sweep-intro',
                    title: 'Sweep Picking Motion Demonstration',
                    duration: '5:30'
                },
                {
                    type: 'text',
                    content: `## Practice Tips for Success

### Daily Routine (15 minutes)
1. **Warm-up** (3 min): Slow single notes
2. **Motion practice** (3 min): Muted sweeps
3. **3-string pattern** (5 min): Focus on cleanliness
4. **Speed bursts** (2 min): Short fast sections
5. **Musical application** (2 min): Use in context

### The Golden Rules
- **Start slower than you think**
- **Use a metronome always**
- **Record yourself** - your ears will catch issues
- **Quality over quantity** - 5 clean sweeps > 50 sloppy ones`
                },
                {
                    type: 'practice',
                    title: 'Week 1 Practice Plan',
                    points: [
                        'Day 1-2: Master the pick motion (muted strings)',
                        'Day 3-4: Add one note at a time to the sweep',
                        'Day 5-6: Connect all notes at 40 BPM',
                        'Day 7: Record yourself and assess'
                    ]
                }
            ]
        },
        goals: [
            {
                id: 'sweep-motion',
                description: 'Perform clean 3-string sweep at 60 BPM',
                type: 'metronome',
                bpm: 60,
                duration: 30
            },
            {
                id: 'muted-drill',
                description: 'Complete muted sweep drill for 2 minutes',
                type: 'practice',
                duration: 120
            }
        ]
    },
    {
        id: 'three-string-sweeps',
        title: '3-String Sweep Patterns',
        description: 'Master essential 3-string arpeggio shapes',
        type: 'technique',
        requiresPrevious: true,
        content: {
            sections: [
                {
                    type: 'hero',
                    title: '3-String Sweep Mastery',
                    subtitle: 'Build Your Foundation with Triads',
                    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&h=600&fit=crop'
                },
                {
                    type: 'text',
                    content: `# Expanding Your Sweep Vocabulary

Now that you understand the basic motion, let's explore different 3-string patterns. These form the foundation for all advanced sweep picking.

## Why Start with 3 Strings?
- Easier to control the motion
- Less string noise to manage
- Builds proper muscle memory
- All larger sweeps are built from 3-string patterns`
                },
                {
                    type: 'tab',
                    title: 'Major Triad Shapes',
                    content: `Shape 1 - C Major (Root on G string):
e|-------8-----------------------
B|----8-----8--------------------
G|-9-----------9-----------------

Shape 2 - C Major (Root on B string):
e|-------12----------------------
B|----13----13-------------------
G|-12----------12----------------

Shape 3 - C Major (Root on E string):
e|-------15----------------------
B|----17----17-------------------
G|-16----------16----------------`
                },
                {
                    type: 'exercise',
                    title: 'Exercise 1: Major Triad Workout',
                    content: {
                        description: 'Practice all major triad inversions',
                        tab: `Connect the shapes:
e|-----8-----------12----------15-----
B|---8---8------13----13----17----17--
G|-9-------9--12--------12-16--------16

Practice ascending and descending
Move through all 12 keys`,
                        tempo: 'Start at 50 BPM',
                        focus: 'Clean transition between shapes',
                        challenge: 'Play through the circle of fifths'
                    }
                },
                {
                    type: 'tab',
                    title: 'Minor Triad Shapes',
                    content: `Shape 1 - A Minor (Root on G string):
e|-------5-----------------------
B|----5-----5--------------------
G|-5-----------5-----------------

Shape 2 - A Minor (Root on B string):
e|-------12----------------------
B|----13----13-------------------
G|-14----------14----------------

Shape 3 - A Minor (Root on E string):
e|-------17----------------------
B|----17----17-------------------
G|-17----------17----------------`
                },
                {
                    type: 'callout',
                    style: 'tip',
                    content: `**Pro Tip**: Notice how the minor shapes have a flattened 3rd compared to major shapes. This small change creates the minor sound!`
                },
                {
                    type: 'exercise',
                    title: 'Exercise 2: Diminished Sweeps',
                    content: {
                        description: 'Add tension with diminished triads',
                        tab: `B Diminished shapes:
e|-----7------10------13------16---
B|---8---8--11----11-14----14-17---
G|-7-------10-------13-------16-----

Notice the symmetrical pattern!
Each shape is 3 frets apart`,
                        tempo: 'Start at 45 BPM',
                        focus: 'Even timing through position shifts'
                    }
                },
                {
                    type: 'image',
                    url: 'https://via.placeholder.com/800x400/f8f8f8/333333?text=3-String+Arpeggio+Shapes+Diagram',
                    caption: 'All 3-string major, minor, and diminished shapes',
                    alt: 'Fretboard diagram showing triad shapes'
                },
                {
                    type: 'exercise',
                    title: 'Exercise 3: Musical Sequences',
                    content: {
                        description: 'Apply sweeps in musical contexts',
                        tab: `Progression: Am - F - C - G
e|---5-------8------12-------7-----
B|-5---5---6---6--13----13-8---8---
G|5------5-5-----12--------7-------

Connect sweeps musically
Add rhythm variations`,
                        tempo: 'Start at 60 BPM',
                        focus: 'Musical phrasing, not just technique'
                    }
                },
                {
                    type: 'text',
                    content: `## Advanced 3-String Concepts

### Adding Extensions
Once comfortable with triads, add 7ths, 9ths, and other extensions:

**Major 7th**: Add the 7th on the next string
**Dominant 7th**: Flat the 7th for bluesy sound
**Minor 7th**: Combine minor triad + b7

### Rhythmic Variations
- **Triplets**: Perfect for 3-note patterns
- **16th notes**: Add a repeated note
- **Quintuplets**: 5 notes over the beat`
                },
                {
                    type: 'practice',
                    title: 'Daily 3-String Routine',
                    points: [
                        'All major shapes in 5 keys (5 min)',
                        'All minor shapes in 5 keys (5 min)',
                        'Diminished patterns (3 min)',
                        'Musical progressions (5 min)',
                        'Speed bursts at 80% max (2 min)'
                    ]
                }
            ]
        },
        goals: [
            {
                id: 'major-sweeps',
                description: 'Play all major triad shapes at 80 BPM',
                type: 'metronome',
                bpm: 80,
                duration: 60
            },
            {
                id: 'minor-sweeps',
                description: 'Play all minor triad shapes at 80 BPM',
                type: 'metronome',
                bpm: 80,
                duration: 60
            },
            {
                id: 'musical-progression',
                description: 'Complete the Am-F-C-G progression cleanly',
                type: 'practice',
                duration: 120
            }
        ]
    },
    {
        id: 'five-string-sweeps',
        title: '5-String Sweep Patterns',
        description: 'Expand to fuller arpeggio sweeps',
        type: 'technique',
        requiresPrevious: true,
        content: {
            sections: [
                {
                    type: 'hero',
                    title: '5-String Sweep Patterns',
                    subtitle: 'Enter the World of Extended Arpeggios',
                    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=600&fit=crop'
                },
                {
                    type: 'text',
                    content: `# The Next Level: 5-String Sweeps

5-string sweeps are where sweep picking becomes truly spectacular. These patterns cover more range and create the flowing, cascading sounds heard in neoclassical and progressive metal.

## Key Differences from 3-String
- **Wider stretch** - Prepare your fingers
- **More string noise** to control
- **Longer pick motion** requires stamina
- **Rolling technique** becomes crucial`
                },
                {
                    type: 'callout',
                    style: 'important',
                    content: `**Critical Technique**: The "finger roll" - When playing notes on the same fret across multiple strings, roll your finger like a barre chord to avoid notes ringing together.`
                },
                {
                    type: 'tab',
                    title: 'Classic Am Add9 Sweep',
                    content: `The most famous 5-string sweep:
e|----------------17-------------
B|-------------17----17----------
G|----------14----------14-------
D|-------14----------------14----
A|----12----------------------12-
E|-x-----------------------------

Focus points:
- Roll finger on fret 17 (B & e strings)
- Roll finger on fret 14 (G & D strings)
- Smooth pick motion throughout`
                },
                {
                    type: 'exercise',
                    title: 'Exercise 1: The Finger Roll',
                    content: {
                        description: 'Master the rolling technique',
                        tab: `Roll exercise (same fret, different strings):
e|-------12----------------------
B|-------12----------------------
G|-------12----------------------
D|-------------------------------

Practice rolling finger to play one note at a time
No notes should ring together!`,
                        tempo: 'No tempo - focus on technique',
                        focus: 'Clean separation of notes'
                    }
                },
                {
                    type: 'tab',
                    title: 'Major 7th Arpeggios',
                    content: `CMaj7 - Shape 1:
e|----------------15-------------
B|-------------12----12----------
G|----------12----------12-------
D|-------14----------------14----
A|----15----------------------15-
E|-x-----------------------------

GMaj7 - Shape 2:
e|----------------7--------------
B|-------------8-----8-----------
G|----------7-----------7--------
D|-------5-----------------5-----
A|----7-----------------------7--
E|-x-----------------------------`
                },
                {
                    type: 'exercise',
                    title: 'Exercise 2: Minor 7th Patterns',
                    content: {
                        description: 'Essential minor 7th shapes',
                        tab: `Am7 sweep pattern:
e|----------------12-------------
B|-------------13----13----------
G|----------12----------12-------
D|-------14----------------14----
A|----12----------------------12-
E|-x-----------------------------

Dm7 sweep pattern:
e|----------------10-------------
B|-------------10----10----------
G|----------10----------10-------
D|-------12----------------12----
A|----10----------------------10-
E|-x-----------------------------`,
                        tempo: 'Start at 40 BPM',
                        focus: 'Even note duration'
                    }
                },
                {
                    type: 'image',
                    url: 'https://via.placeholder.com/800x400/f8f8f8/333333?text=5-String+Arpeggio+Shapes+Library',
                    caption: 'Complete 5-string arpeggio shape reference',
                    alt: 'Diagram showing all common 5-string sweep shapes'
                },
                {
                    type: 'exercise',
                    title: 'Exercise 3: Neo-Classical Sequences',
                    content: {
                        description: 'Yngwie-style sweep sequences',
                        tab: `Dm - Gm - C - F progression:
e|----10-------15-------8--------13---
B|--10--10---15--15---8---8----13--13-
G|-10-----10-15----15-9-----9-14----14
D|12-------17-------10------15--------
A|10-------15-------x-------13--------

Connect with scale runs between sweeps`,
                        tempo: 'Start at 50 BPM',
                        focus: 'Smooth transitions between positions',
                        challenge: 'Add hammer-ons/pull-offs on top strings'
                    }
                },
                {
                    type: 'text',
                    content: `## Troubleshooting Common Issues

### Problem: Notes Ring Together
**Solution**: Focus on finger rolling and lifting

### Problem: Uneven Timing
**Solution**: Practice with strong subdivision, count out loud

### Problem: Pick Gets "Stuck"
**Solution**: Angle pick more, use less pressure

### Problem: Fatigue
**Solution**: Take breaks, build endurance gradually`
                },
                {
                    type: 'practice',
                    title: '5-String Development Plan',
                    points: [
                        'Week 1: Master one shape perfectly',
                        'Week 2: Add second shape, practice transitions',
                        'Week 3: All major 7th shapes',
                        'Week 4: All minor 7th shapes',
                        'Week 5: Musical applications'
                    ]
                },
                {
                    type: 'backing-track',
                    title: 'Sweep Practice Backing Track',
                    key: 'Am',
                    tempo: 80,
                    style: 'Neo-classical',
                    duration: '4:00'
                }
            ]
        },
        goals: [
            {
                id: '5-string-basic',
                description: 'Clean Am add9 sweep at 60 BPM',
                type: 'metronome',
                bpm: 60,
                duration: 60
            },
            {
                id: 'finger-roll',
                description: 'Demonstrate clean finger rolling technique',
                type: 'practice',
                duration: 180
            },
            {
                id: 'maj7-sweeps',
                description: 'Play 3 different Maj7 shapes at 70 BPM',
                type: 'metronome',
                bpm: 70,
                duration: 90
            }
        ]
    },
    {
        id: 'advanced-sweeping',
        title: 'Advanced Sweep Techniques',
        description: 'Economy picking, 6-string sweeps, and beyond',
        type: 'technique',
        requiresPrevious: true,
        content: {
            sections: [
                {
                    type: 'hero',
                    title: 'Advanced Sweep Mastery',
                    subtitle: 'Push Your Limits with Pro Techniques',
                    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1200&h=600&fit=crop'
                },
                {
                    type: 'text',
                    content: `# Beyond the Basics

Welcome to the advanced world of sweep picking! Here we'll explore 6-string patterns, economy picking integration, tapping combinations, and the techniques used by modern virtuosos.

## What Makes Advanced Sweeping Different?
- **Complex fingerings** including stretches and position shifts
- **Mixed techniques** combining sweeps with legato and tapping
- **Speed and accuracy** at extreme tempos (140+ BPM)
- **Musical application** beyond just showing off`
                },
                {
                    type: 'tab',
                    title: '6-String Giant: Am11 Sweep',
                    content: `The full 6-string experience:
e|-------------------12----------
B|----------------12----12-------
G|-------------14----------14----
D|----------14----------------14-
A|-------12----------------------
E|----10-------------------------

Reverse:
E|----10-------------------------
A|-------12----------------------
D|----------14----------------14-
G|-------------14----------14----
B|----------------12----12-------
e|-------------------12----------`
                },
                {
                    type: 'callout',
                    style: 'tip',
                    content: `**Frank Gambale Tip**: "Think of sweep picking as one long note, not individual notes. The pick should glide like a bow on a violin."`
                },
                {
                    type: 'exercise',
                    title: 'Exercise 1: Economy Picking Integration',
                    content: {
                        description: 'Combine sweeps with alternate picking',
                        tab: `Economy pattern (sweep + alternate):
e|-------15-17-19-17-15----------
B|----17----------------17-------
G|-16----------------------16----
D|-------------------------------
Sweep up to 19, alternate pick the descending run
This creates a smooth, musical phrase`,
                        tempo: 'Start at 60 BPM',
                        focus: 'Seamless technique transition'
                    }
                },
                {
                    type: 'tab',
                    title: 'Tapped Arpeggios',
                    content: `Combining sweep and tap:
e|-----------[17]----------------
B|--------13-----13--------------
G|-----14-----------14-----------
D|--15-----------------15--------
A|12-----------------------12----
E|-------------------------------

[17] = right hand tap
Sweep up, tap high note, pull-off and sweep down`
                },
                {
                    type: 'exercise',
                    title: 'Exercise 2: Extended Arpeggios',
                    content: {
                        description: 'Add extensions for jazz fusion sounds',
                        tab: `Cmaj13 sweep pattern:
e|-------------------19----------
B|----------------17----17-------
G|-------------16----------16----
D|----------14----------------14-
A|-------15----------------------
E|----12-------------------------

Contains: Root, 3rd, 5th, 7th, 9th, 13th
Creates sophisticated harmony`,
                        tempo: 'Start at 45 BPM',
                        focus: 'Clear note separation across wide intervals'
                    }
                },
                {
                    type: 'image',
                    url: 'https://via.placeholder.com/800x400/f8f8f8/333333?text=Advanced+Sweep+Patterns+Collection',
                    caption: 'Library of advanced sweep shapes and variations',
                    alt: 'Comprehensive diagram of advanced patterns'
                },
                {
                    type: 'exercise',
                    title: 'Exercise 3: The Virtuoso Challenge',
                    content: {
                        description: 'Jason Becker style sweep/tap lick',
                        tab: `Advanced pattern:
e|-[22]-19-17-19-17----17--------
B|------------------20----20-----
G|----------------------------19-
D|-------------------------------
A|-------------------------------
E|-------------------------------

Continue down:
G|----------------------------19-
D|-------------------------19----
A|----------------------17-------
E|----17-20-17-20-17-20----------

Combines tapping, sweeping, and legato`,
                        tempo: 'Work up from 80 BPM',
                        focus: 'Technical accuracy at speed',
                        challenge: 'Play in different keys'
                    }
                },
                {
                    type: 'text',
                    content: `## Professional Applications

### In Metal/Shred
- Use between fast alternate picked sections
- Create dramatic build-ups
- End solos with massive 6-string sweeps

### In Jazz Fusion
- Outline complex chord changes
- Add extensions (9ths, 11ths, 13ths)
- Combine with chromatic approach notes

### In Progressive Rock
- Create atmospheric textures
- Use clean tone for ethereal sounds
- Layer multiple guitar parts`
                },
                {
                    type: 'video',
                    embedId: 'placeholder-advanced-sweeps',
                    title: 'Advanced Sweep Picking Masterclass',
                    duration: '8:45'
                },
                {
                    type: 'text',
                    content: `## Your Path to Mastery

### Month 1-2: Foundation
- Perfect 3 and 5-string patterns
- Build speed gradually (never sacrifice clarity)
- Record yourself weekly

### Month 3-4: Integration
- Combine with other techniques
- Apply in real musical contexts
- Learn songs featuring sweeps

### Month 5-6: Personal Style
- Create your own patterns
- Develop signature licks
- Focus on musicality over speed`
                },
                {
                    type: 'practice',
                    title: 'Advanced Daily Routine (30 min)',
                    points: [
                        'Warm-up: 3-string patterns (5 min)',
                        '5-string workout all keys (8 min)',
                        '6-string patterns (5 min)',
                        'Economy/sweep combinations (5 min)',
                        'Tapped arpeggios (4 min)',
                        'Musical application/improv (3 min)'
                    ]
                },
                {
                    type: 'callout',
                    style: 'important',
                    content: `**Final Wisdom**: Sweep picking is a tool, not a goal. Use it to express musical ideas, not just to play fast. The best sweepers know when NOT to sweep!`
                }
            ]
        },
        goals: [
            {
                id: '6-string-sweep',
                description: 'Perform clean 6-string sweep at 80 BPM',
                type: 'metronome',
                bpm: 80,
                duration: 60
            },
            {
                id: 'economy-combo',
                description: 'Execute sweep/economy picking combination',
                type: 'practice',
                duration: 120
            },
            {
                id: 'tapped-arpeggio',
                description: 'Complete tapped arpeggio exercise cleanly',
                type: 'practice',
                duration: 150
            },
            {
                id: 'speed-goal',
                description: 'Any 5-string pattern at 120 BPM',
                type: 'metronome',
                bpm: 120,
                duration: 30
            }
        ]
    }
];

export default sweepPickingLessons;
