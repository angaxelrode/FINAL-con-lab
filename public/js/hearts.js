let hearts = [];

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.style('position', 'fixed');
    canvas.style('top', '0');
    canvas.style('left', '0');
    canvas.style('z-index', '-1');
    
    // Create initial hearts
    for (let i = 0; i < 15; i++) {
        hearts.push(new Heart());
    }
}

function draw() {
    clear();
    hearts.forEach(heart => {
        heart.update();
        heart.display();
    });
    
    // Add new hearts occasionally
    if (frameCount % 60 === 0 && hearts.length < 25) {
        hearts.push(new Heart());
    }
    
    // Remove hearts that are off screen
    hearts = hearts.filter(heart => heart.y > -50);
}

class Heart {
    constructor() {
        this.x = random(width);
        this.y = random(height, height + 50);
        this.size = random(3, 6);  // Adjusted for this heart formula
        this.speed = random(0.5, 1.5);
        this.opacity = random(100, 180);
        this.wobble = random(0, TWO_PI);
        this.wobbleSpeed = random(0.02, 0.05);
    }
    
    update() {
        this.y -= this.speed;
        this.wobble += this.wobbleSpeed;
        this.x += sin(this.wobble) * 0.5;
    }
    
    display() {
        push();
        translate(this.x, this.y);
        noStroke();
        fill(255, 20, 147, this.opacity); // Bright pink
        
        beginShape();
        for (let a = 0; a < TWO_PI; a += 0.1) {
            const r = this.size;
            const x = r * 16 * pow(sin(a), 3);
            const y = -r * (13 * cos(a) - 5 * cos(2 * a) - 2 * cos(3 * a) - cos(4 * a));
            vertex(x, y);
        }
        endShape();
        
        pop();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
} 