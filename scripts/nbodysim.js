/// <reference path="vector.js" />
/// <reference path="orbitingbody.js" />
var canvas;
var context;
var bodies = new Array();
var deletedBodyTrails = new Array();
var dt = 0.05;
var t = 0;
var t0 = 0;
var tf = 0;
var newBody;
var drawTrails = false;
var mouseDown = false;

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
    window.addEventListener("keydown", keyPressListener, false);
    window.addEventListener("DOMMouseScroll", mouseWheelHandler, false);

    // add bodies
    var body1 = new OrbitingBody(100000, 12, new Vector().xy(175, 0), new Vector().rTheta(10, 90 * Math.PI / 180));
    body1.color = 'FF9900';
    body1.trailEnabled = drawTrails;
    var body2 = new OrbitingBody(100000, 12, new Vector().xy(-175, 0), new Vector().rTheta(10, 270 * Math.PI / 180));
    body2.color = 'black';
    body2.trailEnabled = drawTrails;
    bodies.push(body1);
    bodies.push(body2);

    // do the first frame, and then animate
    drawBodies();
}

function drawBodies()
{
    context.clearRect(0, 0, canvas.width, canvas.height); // clear the canvas

    updatePositionsVerlet(); // step forward - integrate newton's law
    t += dt;

    // draw trails
    for (var i = 0; i < bodies.length; i++)
        bodies[i].drawTrail(canvas);

    // draw deleted trails
    for (var i = 0; i < deletedBodyTrails.length; i++)
        deletedBodyTrails[i].drawTrail(canvas);

    // draw all bodies to the screen
    for (var i = 0; i < bodies.length; i++)
        bodies[i].drawBody(canvas);

    // user has clicked, but not released and therefore not specified a velocity. draw this, but static
    if (newBody)
        newBody.drawBody(canvas);

    document.getElementById("output").innerHTML = "t = " + t.toFixed(3).toString();
    requestAnimationFrame(drawBodies); // create the animation loop
}

function isCollision(body1, body2)
{
    var r12 = body2.position.subtract(body1.position); // position vector pointing from body1 to body2
    if (r12.length() < body2.radius && body1.mass <= body2.mass)
        return true;

    // bodies that are far away are deleted, for computational purposes
    if (Math.abs(body1.position.x) > 2 * canvas.width || Math.abs(body1.position.y) > 2 * canvas.height)
        return true;

    return false;
}

// get the acceleration between two bodies caused by Newton's law of gravity
function gravityAcceleration(body1, body2)
{
    var r12 = body2.position.subtract(body1.position); // position vector pointing from body1 to body2
    var rhat = r12.getUnitVector();
    return rhat.scalarMultiply(body2.mass / Math.pow(r12.length(), 2));
}

// solve the equations of motion using the Velocity Verlet algorithm
function updatePositionsVerlet()
{
    // calculate the total gravitational force (acceleration) using Newton's 
    // law of gravity (and F = ma) and compute the positions according to the Verlet method
    var a = new Array();
    var removed = false;
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
                    deletedBodyTrails.push(body1);
                    bodies.splice(i, 1);
                    i--;
                    removed = true;
                    break;
                }
                else
                    a[i] = a[i].add(gravityAcceleration(body1, body2));
            }
        }

        if (!removed)
            body1.position = body1.position.add(body1.velocity.scalarMultiply(dt)).add(a[i].scalarMultiply(dt * dt / 2));
    }

    // recompute the force at the updated positions to get the velocity
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

function mouseWheelHandler(e)
{
    // to be implemented...
}

function mouseDownListener(e)
{
    mouseDown = true;
    t0 = t;
    var bRect = canvas.getBoundingClientRect();
    var mouseX = (e.clientX - bRect.left) * (canvas.width / bRect.width) - canvas.width / 2;
    var mouseY = canvas.height / 2 - (e.clientY - bRect.top) * (canvas.height / bRect.height);
    newBody = new OrbitingBody(2000, 2, new Vector().xy(mouseX, mouseY), new Vector().xy(0, 0));
    newBody.trailEnabled = drawTrails;

    canvas.removeEventListener("mousedown", mouseDownListener, false);
    window.addEventListener("mouseup", mouseUpListener, false);

    //  prevents the mouse down event from having an effect on the main browser window
    if (e.preventDefault)
        e.preventDefault();
    else if (e.returnValue)
        evt.returnValue = false;
    return false;
}

function mouseUpListener(e)
{
    mouseDown = false;
    tf = t;
    var bRect = canvas.getBoundingClientRect();
    var mouseX = (e.clientX - bRect.left) * (canvas.width / bRect.width) - canvas.width / 2;
    var mouseY = canvas.height / 2 - (e.clientY - bRect.top) * (canvas.height / bRect.height);

    // get position delta (displacement) to calculate velocity
    var displacement = new Vector().xy(mouseX, mouseY);
    displacement = displacement.subtract(newBody.position);
    newBody.velocity = displacement.scalarMultiply(1 / (3 * (tf - t0)));
    bodies.push(newBody);
    newBody = null

    canvas.addEventListener("mousedown", mouseDownListener, false);
    window.removeEventListener("mouseup", mouseUpListener, false);
}

function keyPressListener(e)
{
    if (e.keyCode == 84)
    {
        drawTrails = !drawTrails;
        deletedBodyTrails = new Array();
        for (var i = 0; i < bodies.length; i++)
        {
            bodies[i].trailEnabled = drawTrails;
            bodies[i].trail = new Array();
        }
    }
}