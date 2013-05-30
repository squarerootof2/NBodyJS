/// <reference path="vector.js" />
/// <reference path="orbitingbody.js" />
var canvas;
var context;
var bodies = new Array();
var dt = 0.005;
var timeFactor = 10;
var t = 0;

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
    var body1 = new OrbitingBody(100000, 10, new Vector().xy(100, 0), new Vector().xy(0, -10));
    body1.color = 'FF9900';
    var body2 = new OrbitingBody(100000, 10, new Vector().xy(-100, 0), new Vector().xy(0, 10));
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
        //updatePositionsVerlet();
        updatePositionsEuler();
        t += dt;
    }

    // draw all bodies to the screen
    for (var i = 0; i < bodies.length; i++)
        bodies[i].draw(canvas);

    document.getElementById("output").innerHTML = "t = " + t.toString();

    requestAnimationFrame(drawBodies); // create the animation loop
}

// get the acceleration between two bodies caused by Newton's law of gravity
function gravityAcceleration(body1, body2)
{
    var r = body2.position.subtract(body1.position);
    var rhat = r.getUnitVector();
    return rhat.scalarMultiply(body2.mass / Math.pow(r.length(), 2));
}

// solve the equations of motion using Verlet integration
function updatePositionsVerlet()
{
    for (var i = 0; i < bodies.length; i++)
    {
        var body1 = bodies[i];
        for (var j = 0; j < bodies.length; j++)
        {
            var body2 = bodies[j];
            if (body1 != body2)
            {
                var a = gravityAcceleration(body1, body2);
                var dr = body1.velocity.add(a.scalarMultiply(dt / 2)).scalarMultiply(dt);
                body1.position = body1.position.add(dr);

                var a2 = gravityAcceleration(body1, body2);
                var dv = a.add(a2).scalarMultiply(dt / 2);
                body1.velocity = body1.velocity.add(dv);
            }
        }
    }
}

// solve the equations of motion using Euler's method
function updatePositionsEuler()
{
    for (var i = 0; i < bodies.length; i++)
    {
        var body1 = bodies[i];
        for (var j = 0; j < bodies.length; j++)
        {
            var body2 = bodies[j];
            if (body1 != body2)
            {
                var a = gravityAcceleration(body1, body2);
                body1.velocity = body1.velocity.add(a.scalarMultiply(dt));
            }
        }
        body1.position = body1.position.add(body1.velocity.scalarMultiply(dt));
    }
}

function mouseDownListener(e)
{
    var bRect = canvas.getBoundingClientRect();
    var mouseX = (e.clientX - bRect.left) * (canvas.width / bRect.width) - canvas.width / 2;
    var mouseY = canvas.height / 2 - (e.clientY - bRect.top) * (canvas.height / bRect.height);
    var body = new OrbitingBody(0, 2, new Vector().xy(mouseX, mouseY), new Vector().xy(0, 0));
    bodies.push(body);
}