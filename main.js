navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
if (navigator.getUserMedia) {
    navigator.getUserMedia({
            audio: true
        },
        function(stream) {
            var audioContext = new AudioContext();
            window.analyser = audioContext.createAnalyser();
            var microphone = audioContext.createMediaStreamSource(stream);
            window.javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

            window.analyser.smoothingTimeConstant = 0.8;
            window.analyser.fftSize = 1024;

            microphone.connect(window.analyser);
            window.analyser.connect(javascriptNode);
            window.javascriptNode.connect(audioContext.destination);

            // canvasContext = $("#canvas")[0].getContext("2d");


        },
        function(err) {
            console.log("The following error occured: " + err.name)
        });
} else {
    console.log("getUserMedia not supported");
}


var mainState = {
    preload: function() { 
        game.load.image('bird', 'assets/bird.png');
        game.load.image('pipe', 'assets/pipe.png');
    },

    create: function() { 
        // Change the background color of the game to blue
        game.stage.backgroundColor = '#71c5cf';

        this.score = 0;
        this.labelScore = game.add.text(20, 20, "0", {
            font: "30px Arial",
            fill: "#ffffff"
        });


        // Set the physics system
        game.physics.startSystem(Phaser.Physics.ARCADE);

        // Display the bird at the position x=100 and y=245
        this.bird = game.add.sprite(100, 245, 'bird');
        this.HOLE_SIZE = 3;

        // Add physics to the bird
        // Needed for: movements, gravity, collisions, etc.
        game.physics.arcade.enable(this.bird);

        // Add gravity to the bird to make it fall
        this.bird.body.gravity.y = 1000;


        // Call the 'jump' function when the spacekey is hit
        var spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        spaceKey.onDown.add(this.jump, this);

        window.javascriptNode.onaudioprocess = () => {
            var array = new Uint8Array(window.analyser.frequencyBinCount);
            window.analyser.getByteFrequencyData(array);
            var values = 0;

            var length = array.length;
            for (var i = 0; i < length; i++) {
                values += (array[i]);
            }

            var average = values / length;

            console.log(Math.round(average));
            if (average > 5 ) this.jump(average*10)
        }

        this.pipes = game.add.group();

        this.timer = game.time.events.loop(1500, this.addRowOfPipes, this);

        this.bird.anchor.setTo(-0.2, 0.5);
    },

    update: function() {
        if (this.bird.y < 0 || this.bird.y > 490)
        this.restartGame();

        game.physics.arcade.overlap(this.bird, this.pipes, this.hitPipe, null, this);

        if (this.bird.angle < 20) this.bird.angle += 1;
    },

    jump: function(value) {
        this.bird.body.velocity.y = -value;
        var animation = game.add.tween(this.bird);
        animation.to({angle: -20}, 100);
        animation.start();

        if (this.bird.alive == false) return;
    },
    
    restartGame: function() {
        // Start the 'main' state, which restarts the game
        game.state.start('main');
    },

    addOnePipe: function(x, y) {
        // Create a pipe at the position x and y
        var pipe = game.add.sprite(x, y, 'pipe');

        // Add the pipe to our previously created group
        this.pipes.add(pipe);

        // Enable physics on the pipe
        game.physics.arcade.enable(pipe);

        // Add velocity to the pipe to make it move left
        pipe.body.velocity.x = -200;

        // Automatically kill the pipe when it's no longer visible
        pipe.checkWorldBounds = true;
        pipe.outOfBoundsKill = true;
    },

    addRowOfPipes: function() {
        // Randomly pick a number between 1 and 5
        // This will be the hole position
        var hole = Math.floor(Math.random() * 5) + 1;

        // Add the 6 pipes
        // With one big hole at position 'hole' and 'hole + 1'

        for (var i = 0; i < 8; i++)
            if (i < hole || i >= hole + this.HOLE_SIZE) this.addOnePipe(400, i * 60 + 10);

        this.score += 1;
        this.labelScore.text = this.score;
        if (this.score > 5) this.HOLE_SIZE--;
    },

    hitPipe: function() {
        // If the bird has already hit a pipe, do nothing
        // It means the bird is already falling off the screen
        if (this.bird.alive == false)
            return;

        // Set the alive property of the bird to false
        this.bird.alive = false;

        // Prevent new pipes from appearing
        game.time.events.remove(this.timer);

        // Go through all the pipes, and stop their movement
        this.pipes.forEach(function(p){
            p.body.velocity.x = 0;
        }, this);
    },
};

var game = new Phaser.Game(800, 490);
setTimeout( ()=> {

    game.state.add('main', mainState);

    game.state.start('main');

}, 2000)

