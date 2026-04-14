import type { Exercise } from '~/types/workout'

/**
 * Built-in exercise templates provided by the app.
 * These are never stored in IndexedDB and are excluded from all user data exports.
 * When added to a workout or session, a fresh UUID is assigned to the copy.
 */
export const PRESET_EXERCISES: Exercise[] = [
    // ── Brust ──────────────────────────────────────────────────────────────
    {
        id: 'preset-bankdruecken',
        type: 'strength',
        name: 'Bankdrücken',
        mode: 'reps+weight',
        sets: [{ reps: 8, weight: 60 }, { reps: 8, weight: 60 }, { reps: 8, weight: 60 }],
    },
    {
        id: 'preset-schraegbank',
        type: 'strength',
        name: 'Schrägbankdrücken',
        mode: 'reps+weight',
        sets: [{ reps: 10, weight: 50 }, { reps: 10, weight: 50 }, { reps: 10, weight: 50 }],
    },
    {
        id: 'preset-butterfly',
        type: 'strength',
        name: 'Butterfly',
        mode: 'reps+weight',
        sets: [{ reps: 12, weight: 40 }, { reps: 12, weight: 40 }, { reps: 12, weight: 40 }],
    },
    {
        id: 'preset-liegestuetze',
        type: 'strength',
        name: 'Liegestütze',
        mode: 'reps',
        sets: [{ reps: 15 }, { reps: 15 }, { reps: 15 }],
    },
    {
        id: 'preset-dips',
        type: 'strength',
        name: 'Dips',
        mode: 'reps',
        sets: [{ reps: 10 }, { reps: 10 }, { reps: 10 }],
    },

    // ── Rücken ─────────────────────────────────────────────────────────────
    {
        id: 'preset-kreuzheben',
        type: 'strength',
        name: 'Kreuzheben',
        mode: 'reps+weight',
        sets: [{ reps: 5, weight: 100 }, { reps: 5, weight: 100 }, { reps: 5, weight: 100 }],
    },
    {
        id: 'preset-klimmzuege',
        type: 'strength',
        name: 'Klimmzüge',
        mode: 'reps',
        sets: [{ reps: 8 }, { reps: 8 }, { reps: 8 }],
    },
    {
        id: 'preset-latzug',
        type: 'strength',
        name: 'Latzug',
        mode: 'reps+weight',
        sets: [{ reps: 10, weight: 60 }, { reps: 10, weight: 60 }, { reps: 10, weight: 60 }],
    },
    {
        id: 'preset-rudern-kabel',
        type: 'strength',
        name: 'Kabelrudern',
        mode: 'reps+weight',
        sets: [{ reps: 12, weight: 50 }, { reps: 12, weight: 50 }, { reps: 12, weight: 50 }],
    },
    {
        id: 'preset-rudern-kurzhantel',
        type: 'strength',
        name: 'Kurzhantelrudern',
        mode: 'reps+weight',
        sets: [{ reps: 10, weight: 30 }, { reps: 10, weight: 30 }, { reps: 10, weight: 30 }],
    },
    {
        id: 'preset-face-pulls',
        type: 'strength',
        name: 'Face Pulls',
        mode: 'reps+weight',
        sets: [{ reps: 15, weight: 20 }, { reps: 15, weight: 20 }, { reps: 15, weight: 20 }],
    },

    // ── Beine ──────────────────────────────────────────────────────────────
    {
        id: 'preset-kniebeugen',
        type: 'strength',
        name: 'Kniebeugen',
        mode: 'reps+weight',
        sets: [{ reps: 8, weight: 80 }, { reps: 8, weight: 80 }, { reps: 8, weight: 80 }, { reps: 8, weight: 80 }],
    },
    {
        id: 'preset-beinpresse',
        type: 'strength',
        name: 'Beinpresse',
        mode: 'reps+weight',
        sets: [{ reps: 10, weight: 120 }, { reps: 10, weight: 120 }, { reps: 10, weight: 120 }],
    },
    {
        id: 'preset-beinstrecken',
        type: 'strength',
        name: 'Beinstrecken',
        mode: 'reps+weight',
        sets: [{ reps: 12, weight: 50 }, { reps: 12, weight: 50 }, { reps: 12, weight: 50 }],
    },
    {
        id: 'preset-beinbeugen',
        type: 'strength',
        name: 'Beinbeugen',
        mode: 'reps+weight',
        sets: [{ reps: 12, weight: 40 }, { reps: 12, weight: 40 }, { reps: 12, weight: 40 }],
    },
    {
        id: 'preset-rumaenisches-kreuzheben',
        type: 'strength',
        name: 'Rumänisches Kreuzheben',
        mode: 'reps+weight',
        sets: [{ reps: 10, weight: 70 }, { reps: 10, weight: 70 }, { reps: 10, weight: 70 }],
    },
    {
        id: 'preset-ausfallschritte',
        type: 'strength',
        name: 'Ausfallschritte',
        mode: 'reps+weight',
        sets: [{ reps: 12, weight: 20 }, { reps: 12, weight: 20 }, { reps: 12, weight: 20 }],
    },
    {
        id: 'preset-goblet-squat',
        type: 'strength',
        name: 'Goblet Squat',
        mode: 'reps+weight',
        sets: [{ reps: 12, weight: 24 }, { reps: 12, weight: 24 }, { reps: 12, weight: 24 }],
    },
    {
        id: 'preset-hip-thrust',
        type: 'strength',
        name: 'Hip Thrust',
        mode: 'reps+weight',
        sets: [{ reps: 10, weight: 80 }, { reps: 10, weight: 80 }, { reps: 10, weight: 80 }],
    },
    {
        id: 'preset-wadenheben',
        type: 'strength',
        name: 'Wadenheben',
        mode: 'reps+weight',
        sets: [{ reps: 15, weight: 60 }, { reps: 15, weight: 60 }, { reps: 15, weight: 60 }],
    },

    // ── Schultern ──────────────────────────────────────────────────────────
    {
        id: 'preset-schulterdruecken',
        type: 'strength',
        name: 'Schulterdrücken',
        mode: 'reps+weight',
        sets: [{ reps: 10, weight: 40 }, { reps: 10, weight: 40 }, { reps: 10, weight: 40 }],
    },
    {
        id: 'preset-seitheben',
        type: 'strength',
        name: 'Seitheben',
        mode: 'reps+weight',
        sets: [{ reps: 12, weight: 10 }, { reps: 12, weight: 10 }, { reps: 12, weight: 10 }],
    },
    {
        id: 'preset-frontheben',
        type: 'strength',
        name: 'Frontheben',
        mode: 'reps+weight',
        sets: [{ reps: 12, weight: 10 }, { reps: 12, weight: 10 }, { reps: 12, weight: 10 }],
    },

    // ── Arme ───────────────────────────────────────────────────────────────
    {
        id: 'preset-bizepscurl',
        type: 'strength',
        name: 'Bizeps Curl',
        mode: 'reps+weight',
        sets: [{ reps: 12, weight: 15 }, { reps: 12, weight: 15 }, { reps: 12, weight: 15 }],
    },
    {
        id: 'preset-hammer-curls',
        type: 'strength',
        name: 'Hammer Curls',
        mode: 'reps+weight',
        sets: [{ reps: 12, weight: 14 }, { reps: 12, weight: 14 }, { reps: 12, weight: 14 }],
    },
    {
        id: 'preset-trizepsdruecken',
        type: 'strength',
        name: 'Trizepsdrücken',
        mode: 'reps+weight',
        sets: [{ reps: 12, weight: 30 }, { reps: 12, weight: 30 }, { reps: 12, weight: 30 }],
    },
    {
        id: 'preset-trizeps-overhead',
        type: 'strength',
        name: 'Trizeps Overhead Extension',
        mode: 'reps+weight',
        sets: [{ reps: 12, weight: 20 }, { reps: 12, weight: 20 }, { reps: 12, weight: 20 }],
    },

    // ── Core ───────────────────────────────────────────────────────────────
    {
        id: 'preset-sit-ups',
        type: 'strength',
        name: 'Sit-Ups',
        mode: 'reps',
        sets: [{ reps: 20 }, { reps: 20 }, { reps: 20 }],
    },
    {
        id: 'preset-plank',
        type: 'strength',
        name: 'Plank',
        mode: 'time',
        sets: [{ duration: 60 }, { duration: 60 }, { duration: 60 }],
    },
    {
        id: 'preset-russian-twist',
        type: 'strength',
        name: 'Russian Twist',
        mode: 'reps',
        sets: [{ reps: 20 }, { reps: 20 }, { reps: 20 }],
    },
    {
        id: 'preset-beinheben',
        type: 'strength',
        name: 'Beinheben (liegend)',
        mode: 'reps',
        sets: [{ reps: 15 }, { reps: 15 }, { reps: 15 }],
    },
    {
        id: 'preset-kabelzug-bauch',
        type: 'strength',
        name: 'Kabelzug Bauch',
        mode: 'reps+weight',
        sets: [{ reps: 15, weight: 20 }, { reps: 15, weight: 20 }, { reps: 15, weight: 20 }],
    },

    // ── Cardio ─────────────────────────────────────────────────────────────
    {
        id: 'preset-laufen',
        type: 'cardio',
        name: 'Laufen',
        duration: 1800,
        metric: 'speed',
        metricValue: 10,
    },
    {
        id: 'preset-fahrrad',
        type: 'cardio',
        name: 'Fahrradfahren',
        duration: 1800,
        metric: 'speed',
        metricValue: 25,
    },
    {
        id: 'preset-rudern-ergometer',
        type: 'cardio',
        name: 'Ruderergometer',
        duration: 1200,
        metric: 'intensity',
        metricValue: 4,
    },
    {
        id: 'preset-seilspringen',
        type: 'cardio',
        name: 'Seilspringen',
        duration: 600,
        metric: 'intensity',
        metricValue: 3,
    },
    {
        id: 'preset-ellipsentrainer',
        type: 'cardio',
        name: 'Ellipsentrainer',
        duration: 1800,
        metric: 'intensity',
        metricValue: 5,
    },
    {
        id: 'preset-hiit',
        type: 'cardio',
        name: 'HIIT',
        duration: 1200,
        metric: 'intensity',
        metricValue: 8,
    },
    {
        id: 'preset-schwimmen',
        type: 'cardio',
        name: 'Schwimmen',
        duration: 1800,
        metric: 'none',
    },
]
