// Utility functions for random, collision, etc.

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rectsCollide(a, b) {
    return !(
        a.x > b.x + b.w ||
        a.x + a.w < b.x ||
        a.y > b.y + b.h ||
        a.y + a.h < b.y
    );
}