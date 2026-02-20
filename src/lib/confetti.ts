import confetti from 'canvas-confetti';

/**
 * Standard confetti burst — for new deals
 */
export function confettiBurst() {
    const defaults = {
        spread: 360,
        ticks: 100,
        gravity: 0.5,
        decay: 0.94,
        startVelocity: 30,
        colors: ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB', '#32CD32']
    };

    confetti({
        ...defaults,
        particleCount: 40,
        scalar: 1.2,
        shapes: ['star']
    });

    setTimeout(() => {
        confetti({
            ...defaults,
            particleCount: 25,
            scalar: 0.75,
            shapes: ['circle']
        });
    }, 150);
}

/**
 * Side cannons — for rank changes
 */
export function confettiSideCannons() {
    const end = Date.now() + 800;
    const colors = ['#FFD700', '#FFA500', '#FF4500', '#00BFFF', '#FF69B4'];

    (function frame() {
        confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.65 },
            colors
        });
        confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.65 },
            colors
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    })();
}

/**
 * Grand celebration — for top 1 changes
 */
export function confettiGrand() {
    const duration = 2000;
    const end = Date.now() + duration;
    const colors = ['#FFD700', '#FFC107', '#FF9800', '#FFEB3B', '#FFFFFF'];

    (function frame() {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 80,
            origin: { x: 0, y: 0.7 },
            colors,
            shapes: ['star', 'circle'],
            scalar: 1.2
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 80,
            origin: { x: 1, y: 0.7 },
            colors,
            shapes: ['star', 'circle'],
            scalar: 1.2
        });
        confetti({
            particleCount: 3,
            angle: 90,
            spread: 120,
            origin: { x: 0.5, y: 0.3 },
            colors,
            gravity: 1.2,
            scalar: 1.5
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    })();
}

/**
 * Birthday / party style — rain down confetti
 */
export function confettiRain() {
    const duration = 1500;
    const end = Date.now() + duration;
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

    (function frame() {
        confetti({
            particleCount: 2,
            angle: 90,
            spread: 160,
            origin: { x: Math.random(), y: -0.1 },
            colors,
            gravity: 0.8,
            ticks: 300,
            shapes: ['square', 'circle']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    })();
}
