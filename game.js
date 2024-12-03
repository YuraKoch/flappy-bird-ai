import { Pipe } from './pipe.js';
import { loadImage } from './utils.js';
import { Ground } from './ground.js';
import { Bird } from './bird.js';
import { checkCollision } from './collision.js';

const { Neat } = neataptic;

export class Game {
  POPULATION_SIZE = 1000;
  SPEED = 3;
  DISTANCE_BETWEEN_PIPES = 3.5 * Pipe.width;
  frameCount = 0;
  score = 0;
  pipes = [];
  birds = [];


  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const width = window.visualViewport ? Math.min(window.visualViewport.width, height * 0.6) : Math.min(window.innerWidth, height * 0.6);
    this.canvas.height = 900;
    this.canvas.width = 900 * width / height;

    this.neat = new Neat(
      4,
      1,
      null,
      {
        popsize: this.POPULATION_SIZE,
        elitism: Math.round(0.2 * this.POPULATION_SIZE),
        mutationRate: 0.5,
        mutationAmount: 3,
      }
    );


    this.BG_IMG = new Image();
    this.ground = new Ground(this.canvas);
  }

  async loadAssets() {
    await Promise.all([
      loadImage(this.BG_IMG, './assets/bg.png'),
      Pipe.preloadImages(),
      Ground.preloadImage(),
      Bird.preloadImage()
    ]);
  }

  start() {
    this.startGeneration();
    this.intervalId = setInterval(() => this.draw(), 10);
  }

  startGeneration() {
    this.frameCount = 0;
    this.score = 0;
    this.birds = this.neat.population.map((genome) => new Bird(this.canvas, genome));
    this.pipes = [new Pipe(this.canvas)];
  }

  nextGeneration() {
    this.neat.sort();
    this.neat.evolve();
    this.startGeneration();
  }

  draw() {
    this.ctx.drawImage(this.BG_IMG, 0, 0, this.canvas.width, this.canvas.height);

    if (this.frameCount * this.SPEED > this.DISTANCE_BETWEEN_PIPES) {
      this.pipes.push(new Pipe(this.canvas));
      this.frameCount = 0;
    }

    this.updatePipes();
    this.ground.update(this.SPEED);
    this.updateBirds();
    this.displayScore();

    this.checkCollisions();
    if (this.birds.every(bird => !bird.isAlive)) this.nextGeneration();
    this.frameCount++;
  }

  updatePipes() {
    for (let i = 0; i < this.pipes.length; i++) {
      this.pipes[i].update(this.SPEED);
      if (this.pipes[i].isOffscreen()) {
        this.pipes.shift();
        i--;
        this.score++;
        this.birds.forEach(bird => {
          if (bird.isAlive) bird.genome.score += 100;
        });
      }
    }
  }

  updateBirds() {
    this.birds.filter(bird => bird.isAlive)
      .forEach(bird => {
        const closestPipe = this.pipes.find(pipe => pipe.x + pipe.width > bird.x - bird.hitboxWidth / 2);
        bird.update(closestPipe);
      });
  }

  checkCollisions() {
    this.birds.forEach(bird => {
      if (bird.isAlive && checkCollision(bird, this.pipes, this.ground)) {
        bird.isAlive = false;
      }
    });
  }


  displayScore() {
    this.ctx.font = '60px Arial';
    this.ctx.fillStyle = 'white';
    this.ctx.textAlign = 'center';

    this.ctx.lineWidth = 8;
    this.ctx.strokeStyle = '#533846';
    this.ctx.textBaseline = 'top';
    this.ctx.strokeText(this.score, this.canvas.width / 2, 15);
    this.ctx.fillText(this.score, this.canvas.width / 2, 15);
  }
}