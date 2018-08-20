navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
if (navigator.getUserMedia) {
    navigator.getUserMedia(
        {
            audio: true
        },
        function (stream) {
            var audioContext = new AudioContext();
            window.analyser = audioContext.createAnalyser();
            var microphone = audioContext.createMediaStreamSource(stream);
            window.javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);
            window.analyser.smoothingTimeConstant = 0.8;
            window.analyser.fftSize = 1024;
            microphone.connect(window.analyser);
            window.analyser.connect(javascriptNode);
            window.javascriptNode.connect(audioContext.destination);
        },
        function (err) {
            console.error("The following error occured: " + err.name)
        });
} else {
    alert("Sound not supported");
}

const HOLE_SIZE = 5;
const ROWS_FREQUENCY = 2500;
const ROWS_SPEED = 200;
const WINDOW_LENGTH = 800;
const WINDOW_HEIGHT = 490;
const KEY_VALUE = 1;
let FREQUENCY_LIMIT = 5;
let frequency_counter = 0;
let BEGIN_SCORE = 3;
let VALUE_GAIN = 70;
let GRAVITY_VALUE = 1000;

// set form values

const volume_gain_el = $('#VALUE_GAIN');
const gravity_gain_el = $('#GRAVITY_VALUE');
const begin_score_el = $('#BEGIN_SCORE');

volume_gain_el.val(VALUE_GAIN);
gravity_gain_el.val(GRAVITY_VALUE);
begin_score_el.val(BEGIN_SCORE);


var mainState = {
    preload: function () {
        game.load.image('pipe', 'assets/pipe2.png');
        game.load.image('bird', 'assets/dkmt_logo.png');
        game.load.image('finish', 'assets/finish.png');
    },

    create: function () {
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
        //mic_event
        window.javascriptNode.onaudioprocess = () => {
            let array = new Uint8Array(window.analyser.frequencyBinCount);
            window.analyser.getByteFrequencyData(array);
            var values = 0;
            var length = array.length;
            for (var i = 0; i < length; i++) {
                values += (array[i]);
            }
            var average = values / length;

            if (average > 45 && frequency_counter++ > FREQUENCY_LIMIT) {
                this.jump({value: Math.round(average / 70)});
                console.log(Math.round(average));
                frequency_counter = 0;
            }
        };

        this.pipes = game.add.group();
        this.timer = game.time.events.loop(ROWS_FREQUENCY, this.addRowOfPipes, this);
        this.bird.anchor.setTo(-0.2, 0.5);
    },

    update: function () {
        if (this.bird.y < 0) this.bird.y = 50;
        if (this.bird.y > 470) this.bird.body.velocity.y = -VALUE_GAIN * 4;
        // if (this.bird.y < 0 || this.bird.y > 490) this.restartGame();
        game.physics.arcade.overlap(this.bird, this.pipes, this.hitPipe, null, this);
        if (this.bird.angle < 20) this.bird.angle += 1;
    },

    jump: function (options) {
        if (!options.value) options.value = KEY_VALUE;
        this.bird.body.velocity.y = -VALUE_GAIN * options.value;
        var animation = game.add.tween(this.bird);
        animation.to({angle: -20}, 100);
        animation.start();
        if (this.bird.alive == false) return false;
    },

    restartGame: function () {
        game.state.start('main');
    },

    addOnePipe: function (x, y) {
        let pipe = game.add.sprite(x, y, this.score == 1 ? 'finish' : 'pipe');
        this.pipes.add(pipe);
        game.physics.arcade.enable(pipe);
        pipe.body.velocity.x = -ROWS_SPEED;
        pipe.checkWorldBounds = true;
        pipe.outOfBoundsKill = true;
    },

    addRowOfPipes: function () {
        var hole = Math.floor(Math.random() * 5) + 1;
        for (var i = 0; i < 8; i++) {
            if (i < hole || i >= hole + this.HOLE_SIZE) this.addOnePipe(400, i * 60 + 10);
        }
        this.score--;

        this.labelScore.text = this.score;
        if (this.score < 0) {
            this.winnerLabel.text = 'Победа!!';
            this.labelScore.text = '';
            game.stage.backgroundColor = '#74bf2e';
            this.bird.body.gravity.y = 300;
            this.hitPipe();
            setTimeout(()=>this.restartGame(), 2000);
        }
    },

    hitPipe: function () {
        setTimeout(()=>this.restartGame(), 2000);

        if (!this.bird.alive) return false;
        this.bird.alive = false;
        game.time.events.remove(this.timer);
        this.pipes.forEach(p => p.body.velocity.x = 0, this);
        // this.bird.body.gravity.y = 300;
        // this.hitPipe();
        // this.this.loserLabel.text = `GAME OVER!! YOU SCORE ${this.score}`;
        // this.labelScore.text = '';
        if (this.score > 0)game.stage.backgroundColor = '#cc5353';

    }
};

var game = new Phaser.Game(WINDOW_LENGTH, WINDOW_HEIGHT, Phaser.AUTO, 'game-area');
setTimeout(()=> {
    game.state.add('main', mainState);
    game.state.start('main');
}, 2000);

volume_gain_el.change(function () {
    VALUE_GAIN = $(this).val();
});

gravity_gain_el.change(function () {
    GRAVITY_VALUE = $(this).val();
});

begin_score_el.change(function () {
    BEGIN_SCORE = $(this).val();
});