/// <reference path="vector.js" />
/// <reference path="orbitingbody.js" />
var canvas;
var context;
var bodies = new Array();
var dt = 0.05;
var timeFactor = 1;
var t = 0;
var t0 = 0;
var tf = 0;
var newBody;

function init()
{
    canvas = document.getElementById('canvas');
    context = canvas.getContext("2d");

    window.requestAnimationFrame = (function ()
    {
        // allows this function to work on any browser as each browser has a different namespace for animation
        return window.requestAnimationFrame ||      // chromium 
        window.webkitRequestAnimationFrame ||       // webkit
        window.mozRequestAnimationFrame ||          // mozilla geko
        window.oRequestAnimationFrame ||            // opera presto
        window.msRequestAnimationFrame ||           // IE trident?

        // fallback function if nothing else works
        function (callback, element)
        {
            window.setTimeout(callback, 1000 / 60);
        }
    })();

    // add event handlers
	canvas.addEventListener("mousedown", mouseDownListener, false);

    // add bodies
    var body1 = new OrbitingBody(100000, 10, new Vector().xy(150, 0), new Vector().xy(0, -10));
    body1.color = 'FF9900';
    var body2 = new OrbitingBody(100000, 10, new Vector().xy(-151, 0), new Vector().xy(0, 10));
    body2.color = 'black';
    var body3 = new OrbitingBody(1, 2, new Vector().xy(-150, 0), new Vector().xy(0, 35));
    var body4 = new OrbitingBody(1, 2, new Vector().xy(-300, 0), new Vector().xy(0, 10));
    bodies.push(body1);
    bodies.push(body2);
    bodies.push(body3);
    bodies.push(body4);

    // do the first frame, and then animate
    drawBodies();
}

function drawBodies()
{
    context.clearRect(0, 0, canvas.width, canvas.height); // clear the canvas

    // step forward - integrate newton's law
    for (var i = 0; i < timeFactor; i++)
    {
        updatePositionsVerlet();
        //updatePositionsEuler();
        t += dt;
    }
	
    // draw all bodies to the screen
    for (var i = 0; i < bodies.length; i++)
        bodies[i].draw(canvas);

	if(newBody)
		newBody.draw(canvas);
		
    document.getElementById("output").innerHTML = "t = " + t.toFixed(3).toString();
    requestAnimationFrame(drawBodies); // create the animation loop
}

function isCollision(body1, body2)
{
	var r12 = body2.position.subtract(body1.position); // position vector pointing from body1 to body2
	if (r12.length() < body2.radius && body1.mass <= body2.mass)
		return true;
	return false;
}

// get the acceleration between two bodies caused by Newton's law of gravity
function gravityAcceleration(body1, body2)
{
    var r12 = body2.position.subtract(body1.position);	// position vector pointing from body1 to body2
    var rhat = r12.getUnitVector();
    return rhat.scalarMultiply(body2.mass / Math.pow(r12.length(), 2));
}

// solve the equations of motion using the Velocity Verlet algorithm
function updatePositionsVerlet()
{
	 var a = new Array();
     for (var i = 0; i < bodies.length; i++)
     {
		var body1 = bodies[i];
		a.push(new Vector().xy(0, 0));
		for (var j = 0; j < bodies.length; j++)
		{
			if (i != j)
			{
				var body2 = bodies[j];
				if (isCollision(body1, body2))
				{
					bodies.splice(i, 1);
					i--;
				}
				else
					a[i] = a[i].add(gravityAcceleration(body1, body2));
			}
		}
		body1.position = body1.position.add(body1.velocity.scalarMultiply(dt)).add(a[i].scalarMultiply(dt * dt / 2));
     }
	
	for (var i = 0; i < bodies.length; i++)
    {
		var body1 = bodies[i];
		var a2 = new Vector().xy(0, 0);
		for (var j = 0; j < bodies.length; j++)
		{
			if (i != j)
			{
				var body2 = bodies[j];
				a2 = a2.add(gravityAcceleration(body1, body2));
			}
		}
		body1.velocity = body1.velocity.add(a2.add(a[i]).scalarMultiply(dt / 2));
    }
}

// solve the equations of motion using Euler's method
function updatePositionsEuler()
{
    for (var i = 0; i < bodies.length; i++)
    {
		var body1 = bodies[i];
		var a = new Vector().xy(0, 0);
		for (var j = 0; j < bodies.length; j++)
		{
			if (i != j)
			{
				var body2 = bodies[j];
				if (isCollision(body1, body2))
				{
					bodies.splice(i, 1);
					i--;
				}
				else
					a = a.add(gravityAcceleration(body1, body2));
			}
		}
		body1.velocity = body1.velocity.add(a.scalarMultiply(dt));
		body1.position = body1.position.add(body1.velocity.scalarMultiply(dt));
    }
}

function mouseDownListener(e)
{
	t0 = t;
    var bRect = canvas.getBoundingClientRect();
    var mouseX = (e.clientX - bRect.left) * (canvas.width / bRect.width) - canvas.width / 2;
    var mouseY = canvas.height / 2 - (e.clientY - bRect.top) * (canvas.height / bRect.height);
    newBody = new OrbitingBody(0, 2, new Vector().xy(mouseX, mouseY), new Vector().xy(0, 0));
	
	canvas.removeEventListener("mousedown", mouseDownListener, false);
	window.addEventListener("mouseup", mouseUpListener, false);
}

function mouseUpListener(e)
{
	tf = t;
	var bRect = canvas.getBoundingClientRect();
	var mouseX = (e.clientX - bRect.left) * (canvas.width / bRect.width) - canvas.width / 2;
	var mouseY = canvas.height / 2 - (e.clientY - bRect.top) * (canvas.height / bRect.height);
	
	// get position delta (displacement) to calculate velocity
	var displacement = new Vector().xy(mouseX, mouseY);
	displacement = displacement.subtract(newBody.position);
	newBody.velocity = displacement.scalarMultiply(1 / ( 3 * (tf - t0)));
	bodies.push(newBody);
	newBody = null
	
	canvas.addEventListener("mousedown", mouseDownListener, false);
	window.removeEventListener("mouseup", mouseUpListener, false);
}







