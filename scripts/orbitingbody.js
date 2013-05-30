function OrbitingBody(mass, radius, position, velocity)
{
    this.mass = mass;
    this.radius = radius;
    this.position = position;
    this.velocity = velocity;
    this.color = 'white';
}

OrbitingBody.prototype.draw = function (canvas)
{
    var ctx = canvas.getContext("2d");
    var x = canvas.width / 2 + this.position.x;
    var y = canvas.height / 2 - this.position.y;
	
	if (x < 0 || y < 0) // don't attempt to draw if we don't need to
		return;

    // draw background glow
    var grd = ctx.createRadialGradient(x, y, 0.01, x, y, 10 * Math.log(this.radius));
    grd.addColorStop(0, "wheat");
    grd.addColorStop(1, "transparent");

    // Fill with gradient
    ctx.fillStyle = grd;
    ctx.fillRect(x - 20, y - 20, 150, 80);

    // draw main circle
    ctx.beginPath();
    ctx.arc(x, y, this.radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = this.color;
    ctx.fill();
}