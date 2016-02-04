window.onload = function() {
	//var game = new Phaser.Game(640, 480, Phaser.CANVAS);
	var myDataRef = new Firebase('https://wippo-jump.firebaseio.com');
	var HistoryRef = new Firebase('https://wippo-jump.firebaseio.com/history');
	var innerWidth = window.innerWidth;
	var innerHeight = window.innerHeight;
	var gameRatio = innerWidth/innerHeight;
	var game = new Phaser.Game(Math.floor(720*gameRatio), 720, Phaser.CANVAS);
	var ninja;
	var ninjaGravity = 800;
	var ninjaJumpPower;
	var score=0;
	var button_re;
	var button_main;
	var scoreText;
	var dummyscore;
		 var topName = $.urlParam('bn');
     var topScore = $.urlParam('bscore');
     var powerBar;
     var powerTween;
     var placedPoles;
	var poleGroup;
     var minPoleGap = 120;
     var maxPoleGap = 250;
     var ninjaJumping;
     var ninjaFallingDown;
	var jumps;
	var maxExtraJumps = 1;
     var play = function(game){}
     play.prototype = {
		preload:function(){
			game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
			game.scale.setScreenSize(true);
			// select character
			var char = "assets/img/wippo_game/wippo-"+$.urlParam('char')+".png";
			game.load.image("ninja", char);
			game.load.image("pole", "pole.jpg");
      game.load.image("powerbar", "powerbar.png");
      game.load.image("background", "assets/img/bg_wipcamp.jpg");
      game.load.spritesheet('button_re', 'assets/img/button_re.png', 206, 77);
      game.load.spritesheet('button_main', 'assets/img/button_main.png', 206, 77);

		},
		create:function(){
			 myDataRef.once("value", function(snapshot) {
	 		 snapshot.forEach(function(data) {
	    		console.log("The " + data.key() + " score is " + data.val());
	  			if (data.key() == "name") {topName = data.val();topName = decodeURIComponent(topName)};
	 				if (data.key() == "top") {dummyScore = data.val()};
	  		});
	 		 topScore = dummyScore;
	 		});


			ninjaJumping = false;
			ninjaFallingDown = false;
			score = 0;
			placedPoles = 0;
			jumps = 0;

			var bg = game.add.tileSprite(0, 0, 1000, 600, 'background');
			if (game.width < 1440) {
				var x = ((1440-game.width)/2)*-1;
				bg.x = x;
				bg.width = 1440;
			}
			else{
				bg.x = 0;
				bg.width = game.width;
			}
  		bg.y = 0;
  		bg.height = game.height;

  		bg.smoothed = false;

  		// get high score

			poleGroup = game.add.group();
			// topScore = localStorage.getItem("topFlappyScore")==null?0:localStorage.getItem("topFlappyScore");
			hero = $.urlParam('name');
			hero = decodeURIComponent(hero);
			scoreText = game.add.text(game.width-300,20,"-",{
				font:"bold 20px Helvetica",
				fill: "#ffffff"
			});
			console.log(topName);
			topName = decodeURIComponent(topName);
			updateScore();
			game.stage.backgroundColor = "#87CEEB";
			game.physics.startSystem(Phaser.Physics.ARCADE);
			ninja = game.add.sprite(80,0,"ninja");
			ninja.anchor.set(0.5);
			ninja.lastPole = 1;
			game.physics.arcade.enable(ninja);
			ninja.body.gravity.y = ninjaGravity;
			addPole(80);
		},
		update:function(){
			game.physics.arcade.collide(ninja, poleGroup, checkLanding);
			if(ninja.y>game.height){
				die();
				button = game.add.button(game.world.centerX - 230, game.world.centerY, 'button_re', actionOnClick_re, this, 2, 1, 0);
				button = game.add.button(game.world.centerX + 15, game.world.centerY, 'button_main', actionOnClick_main, this, 2, 1, 0);
				game.stage.backgroundColor = "rgba(255, 255, 255, 0.5)";
			}
		}
	}
     game.state.add("Play",play);
     game.state.start("Play");
	function updateScore(){
		scoreText.text = "Player: "+hero+"\nScore: "+score+"\nBest Player: "+topName+"\nBest Score: "+topScore;
	}
	function prepareToJump(){
		if(ninja.body.velocity.y==0 || jumps<maxExtraJumps){
			jumps++;
	          powerBar = game.add.sprite(ninja.x,ninja.y-50,"powerbar");
	          powerBar.width = 0;
	          powerTween = game.add.tween(powerBar).to({
			   width:100
			}, 1000, "Linear",true);
			game.input.onDown.remove(prepareToJump, this);
			game.input.onUp.add(jump, this);
          }
	}
     function jump(){
          ninjaJumpPower= -powerBar.width*3-100
          powerBar.destroy();
          game.tweens.removeAll();
          ninja.body.velocity.y = ninjaJumpPower*2;
          ninjaJumping = true;
          powerTween.stop();
          game.input.onUp.remove(jump, this);
		if(jumps<maxExtraJumps){
			game.input.onDown.add(prepareToJump, this);
		}
     }
     function addNewPoles(){
     	var maxPoleX = 0;
		poleGroup.forEach(function(item) {
			maxPoleX = Math.max(item.x,maxPoleX)
		});
		var nextPolePosition = maxPoleX + game.rnd.between(minPoleGap,maxPoleGap);
		addPole(nextPolePosition);
	}
	function addPole(poleX){
		if(poleX<game.width*2){
			placedPoles++;
			var pole = new Pole(game,poleX,game.rnd.between(380,480));
			game.add.existing(pole);
	          pole.anchor.set(0.5,0);
			poleGroup.add(pole);
			var nextPolePosition = poleX + game.rnd.between(minPoleGap,maxPoleGap);
			addPole(nextPolePosition);
		}
	}
	function die(){
		localStorage.setItem("topFlappyScore",Math.max(score,topScore));

		// if(Math.max(score,topScore))localStorage.setItem("hero",$.urlParam('char').capitalizeFirstLetter());
		// if(false)game.state.start("Play");
	}
	function checkLanding(n,p){
		game.input.onDown.remove(prepareToJump, this);
		if(n.body.touching.down){
			var border = n.x-p.x
			if(Math.abs(border)>35){
				n.body.velocity.x=border*2;
				n.body.velocity.y=-200;
			}
			else{
				jumps=0;
               	game.input.onDown.add(prepareToJump, this);
			}
			var poleDiff = p.poleNumber-n.lastPole;
			if(poleDiff>0){
				score+= Math.pow(2,poleDiff);
				updateScore();
				n.lastPole= p.poleNumber;
				ninja.x=80;
			}
			if(ninjaJumping){
               	ninjaJumping = false;
          	}
		}
		else{
			ninjaFallingDown = true;
			poleGroup.forEach(function(item) {
				item.body.velocity.x = 0;
			});
		}
	}
	Pole = function (game, x, y) {
		Phaser.Sprite.call(this, game, x, y, "pole");
		game.physics.enable(this, Phaser.Physics.ARCADE);
          this.body.immovable = true;
          this.poleNumber = placedPoles;
	};
	Pole.prototype = Object.create(Phaser.Sprite.prototype);
	Pole.prototype.constructor = Pole;
	Pole.prototype.update = function() {
          if(ninjaJumping && !ninjaFallingDown){
               this.body.velocity.x = ninjaJumpPower;
          }
          else{
               this.body.velocity.x = 0
          }
		if(this.x<-this.width){
			this.destroy();
			addNewPoles();
		}
	}

	
	String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
	}
	function actionOnClick_re () {
		game.state.start("Play");
		if (score > topScore){
			myDataRef.update({ top: score , name: $.urlParam('name')}, onComplete);
			topScore = score;
			topName = hero;
		}
		else
			console.log('false');

		HistoryRef.push({ 'name': hero, 'score': score });

	}
	function actionOnClick_main () {
		window.location.replace("http://game.wip.camp");
		if (score > topScore){
			myDataRef.update({ top: score , name: $.urlParam('name')}, onComplete);
			topScore = score;
			topName = hero;
		}
		else
			console.log('false');

		HistoryRef.push({ 'name': hero, 'score': score });

	}

	var onComplete = function(error) {
  if (error) {
    console.log('Synchronization failed');
  } else {
    console.log('Synchronization succeeded');
  }
};

}

$.urlParam = function(name){
	var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
	return results[1] || 0;
	}