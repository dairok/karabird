// navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
// if (navigator.getUserMedia) {
//     navigator.getUserMedia({
//             audio: true
//         },
//         function(stream) {
//             var audioContext = new AudioContext();
//             window.analyser = audioContext.createAnalyser();
//             var microphone = audioContext.createMediaStreamSource(stream);
//             window.javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

//             window.analyser.smoothingTimeConstant = 0.8;
//             window.analyser.fftSize = 1024;

//             microphone.connect(window.analyser);
//             window.analyser.connect(javascriptNode);
//             window.javascriptNode.connect(audioContext.destination);

//             // canvasContext = $("#canvas")[0].getContext("2d");


//         },
//         function(err) {
//             console.log("The following error occured: " + err.name)
//         });
// } else {
//     console.log("getUserMedia not supported");
// }

const BEGIN_SCORE = 2;
const HOLE_SIZE = 5;
const GRAVITY_VALUE = 1000;
const ROWS_FREQUENCY = 2500;
const ROWS_SPEED = 200;
const WINDOW_LENGTH = 800;
const WINDOW_HEIGHT = 490;

var mainState = {
    preload: function() {
        game.load.image('pipe', 'assets/pipe2.png');
        game.load.image('bird', 'assets/dkmt_logo.png');
        game.load.image('finish', 'assets/finish.png');
    },

    create: function() { 
        game.stage.backgroundColor = '#71c5cf';
        this.score = BEGIN_SCORE;
        this.HOLE_SIZE = HOLE_SIZE;
        this.labelScore = game.add.text(20, 20, BEGIN_SCORE.toString(), {
            font: "30px Arial",
            fill: "#ffffff"
        });
        this.winnerLabel = game.add.text(200, 170, '', {
            font: "90px Arial",
            fill: "#ffffff"
        });
        game.physics.startSystem(Phaser.Physics.ARCADE);
        this.bird = game.add.sprite(100, 245, 'bird');
        game.physics.arcade.enable(this.bird);
        this.bird.body.gravity.y = GRAVITY_VALUE;
        //space_key
        var spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        spaceKey.onDown.add(this.jump, this);

        // window.javascriptNode.onaudioprocess = () => {
        //     var array = new Uint8Array(window.analyser.frequencyBinCount);
        //     window.analyser.getByteFrequencyData(array);
        //     var values = 0;
        //     var length = array.length;
        //     for (var i = 0; i < length; i++) {
        //         values += (array[i]);
        //     }
        //     var average = values / length;
        //     console.log(Math.round(average));
        //     if (average > 5 ) this.jump(average*10)
        // }

        this.pipes = game.add.group();
        this.timer = game.time.events.loop(ROWS_FREQUENCY, this.addRowOfPipes, this);
        this.bird.anchor.setTo(-0.2, 0.5);
    },

    update: function() {
        if (this.bird.y < 0 || this.bird.y > 490) this.restartGame();
        game.physics.arcade.overlap(this.bird, this.pipes, this.hitPipe, null, this);
        if (this.bird.angle < 20) this.bird.angle += 1;
    },

    jump: function(value) {
        this.bird.body.velocity.y = -450;
        var animation = game.add.tween(this.bird);
        animation.to({angle: -20}, 100);
        animation.start();
        if (this.bird.alive == false) return false;
    },
    
    restartGame: function() {
        game.state.start('main');
    },

    addOnePipe: function(x, y) {
        let pipe = game.add.sprite(x, y, this.score == 1 ? 'finish' : 'pipe');
        this.pipes.add(pipe);
        game.physics.arcade.enable(pipe);
        pipe.body.velocity.x = - ROWS_SPEED;
        // Automatically kill the pipe when it's no longer visible
        pipe.checkWorldBounds = true;
        pipe.outOfBoundsKill = true;
    },

    addRowOfPipes: function() {
        var hole = Math.floor(Math.random() * 5) + 1;
        for (var i = 0; i < 8; i++) {
            if (i < hole || i >= hole + this.HOLE_SIZE) this.addOnePipe(400, i * 60 + 10);
        }
        this.score -= 1;

        this.labelScore.text = this.score;
         if (this.score < 0) {
             this.winnerLabel.text = 'Победа!!';
             this.labelScore.text = '';
             game.stage.backgroundColor = '#74bf2e';
             this.bird.body.gravity.y = 300;
             this.hitPipe();
         }
    },

    hitPipe: function() {
        // If the bird has already hit a pipe, do nothing
        // It means the bird is already falling off the screen
        if (this.bird.alive == false) return false;
        this.bird.alive = false;
        game.time.events.remove(this.timer);

        // Go through all the pipes, and stop their movement
        this.pipes.forEach(p => p.body.velocity.x = 0, this);
    }
};

var game = new Phaser.Game(WINDOW_LENGTH, WINDOW_HEIGHT);
// setTimeout( ()=> {

    game.state.add('main', mainState);

    game.state.start('main');

// }, 2000)

