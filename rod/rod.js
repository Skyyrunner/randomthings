var timestep = 0.0005;

// A 3d vector that represents direction and magnitude, having one point bound to 0,0,0.
// Can also be used to represent position.
Vector3.prototype.xyz = null;
Vector3.prototype.getLength = function() { 
    return Math.sqrt(this.xyz[0] * this.xyz[0] + this.xyz[1] * this.xyz[1] + this.xyz[2] * this.xyz[2]); 
};
// Equivalent to /=, as in it edits this object and returns.
Vector3.prototype.divideBy = function(number) { 
    this.xyz[0] /= number; 
    this.xyz[1] /= number; 
    this.xyz[2] /= number;
    return this; 
};
    
Vector3.prototype.divide = function(number) {
    var x = this.xyz[0] / number;
    var y = this.xyz[1] / number;
    var z = this.xyz[2] / number;
    return new Vector3([x,y,z]);
};
    
Vector3.prototype.multiplyBy = function(number) { 
    this.xyz[0] *= number; 
    this.xyz[1] *= number; 
    this.xyz[2] *= number;
    return this; 
};

Vector3.prototype.multiply = function(number) { 
    var x = this.xyz[0] * number;
    var y = this.xyz[1] * number;
    var z = this.xyz[2] * number;
    return new Vector3([x,y,z]);
};
    
Vector3.prototype.addBy = function(vect) {
    this.xyz[0] += vect.xyz[0];
    this.xyz[1] += vect.xyz[1];
    this.xyz[2] += vect.xyz[2];
    return this;
};

Vector3.prototype.add = function(vect) {
    var x = this.xyz[0] + vect.xyz[0];
    var y = this.xyz[1] + vect.xyz[1];
    var z = this.xyz[2] + vect.xyz[2];
    return new Vector3([x,y,z]);
};

// does this - vect
Vector3.prototype.subtract = function(vect) {
    var x = this.xyz[0] - vect.xyz[0];
    var y = this.xyz[1] - vect.xyz[1];
    var z = this.xyz[2] - vect.xyz[2];
    return new Vector3([x,y,z]);
};

Vector3.prototype.cross = function(vect) {
    var x = this.xyz[1] * vect.xyz[2] - vect.xyz[1] * this.xyz[2]; // y1 * z2 - y2 * z1
    var y = this.xyz[2] * vect.xyz[0] - vect.xyz[2] * this.xyz[0]; // z1 * x2 - z2 * x1
    var z = this.xyz[0] * vect.xyz[1] - vect.xyz[0] * this.xyz[1]; // x1 * y2 - x2 * y1
    return new Vector3([x,y,z]);
};

Vector3.prototype.dot = function(vect) {
    return this.xyz[0] * vect.xyz[0] + this.xyz[1] * vect.xyz[1] + this.xyz[2] * vect.xyz[2];
};

Vector3.prototype.normalize = function() {
    var len = this.getLength();
    this.xyz[0] /= len;
    this.xyz[1] /= len;
    this.xyz[2] /= len;
    return this;
};
 
function getDistance(vect1, vect2) {
    var x = vect1.xyz[0] - vect2.xyz[0];
    var y = vect1.xyz[1] - vect2.xyz[1];
    var z = vect1.xyz[2] - vect2.xyz[2];
    return Math.sqrt(x*x+y*y+z*z);
}

function getMidpoint(vect1, vect2) {
    var x = (vect1.xyz[0] + vect2.xyz[0])/2.0;
    var y = (vect1.xyz[1] + vect2.xyz[1])/2.0;
    var z = (vect1.xyz[2] + vect2.xyz[2])/2.0;
    return new Vector3([x,y,z]);
}

// Implements Rodrigue's rotation formula.
function rotateVector(rotated, rotation) {
    var angle = rotation.getLength();
    var k = new Vector3(rotation.xyz).normalize(); // get the unit vector that represents the axis to be rotated around.
    var temp1 = rotated.multiply(Math.cos(angle));
    var temp2 = k.cross(rotated).multiplyBy(Math.sin(angle));
    var temp3 = k.multiply(k.dot(rotated) * (1 - Math.cos(angle)));
    temp1.addBy(temp2).addBy(temp3);
    return new Vector3(temp1.xyz);
}

// Provide xyz only for a bound vector, or both xyz and xyz2 to calculate a vector by xyz2 - xyz.
function Vector3(xyz, xyz2) {
    if (xyz == undefined) {
        this.xyz = [0,0,0];
    }
    else if (xyz2==undefined){
        this.xyz = xyz.slice(0); // must copy by value
    }
    else {
        this.xyz = [0,0,0];
        this.xyz[0] = xyz2[0] - xyz[0];
        this.xyz[1] = xyz2[1] - xyz[1];
        this.xyz[2] = xyz2[2] - xyz[2];
    }
}

// A node.
Node.prototype.position = null;
Node.prototype.isFixed = true;
Node.prototype.getX = function(){return this.position.xyz[0];};
Node.prototype.getY = function(){return this.position.xyz[1];};
Node.prototype.getZ = function(){return this.position.xyz[2];};
Node.prototype.getXYZ = function(){return this.position.xyz.slice(0);};
function Node(x, y, isfixed) {
    this.position = new Vector3([x, y, 0]);
    this.isFixed = isfixed;
}


// Absorbs all forces applied to it, compared to being a Rod.
NoLink.prototype.applyForceToCoM = function(F){return;};
NoLink.prototype.applyForceToEnd = function(F,n,caller){return;};
NoLink.prototype.isLink = false;
function NoLink() {

}

Rod.prototype.node1 = null;
Rod.prototype.node2 = null;
Rod.prototype.link1 = null; // Link 1 is node 1, and link 2 is node 2.
Rod.prototype.link2 = null;
Rod.prototype.isLink = true; // returns true if it's actually connected to a rod.
Rod.prototype.mass = 0;
Rod.prototype.angVel = null;
Rod.prototype.velocity = null;
Rod.prototype.I = 0; // moment of inertia
Rod.prototype.calcInertia = function() {
    var dist = getDistance(this.node1.position, this.node2.position);
    this.I = this.mass * dist * dist / 12.0;
}
Rod.prototype.applyForceToCoM = applyForceToCenterOfMass;
Rod.prototype.applyForceToEnd = applyForceToNode2;
Rod.prototype.step = step;
Rod.prototype.getLength = function(){
    return getDistance(this.node1.position, this.node2.position);
}

function Rod(node1, node2, mass) {
    this.node1 = node1;
    this.node2 = node2;
    this.link1 = new NoLink();
    this.link2 = new NoLink();
    this.mass = mass;
    this.velocity = new Vector3([0,0,0]);
    this.angVel = new Vector3([0,0,0]);
}

// should be bound to a Rod. F is a Vector3 in units of Newtons.
function applyForceToCenterOfMass(F) {
    // if both ends are fixed, nothing happens.
    if (this.node1.isFixed && this.node2.isFixed)
        return;
    // if both ends are free, the mass simply gains velocity.
    else if (!this.node1.isFixed && !this.node2.isFixed) {
        this.velocity.addBy(F.divide(this.mass).multiplyBy(timestep));
    }
    // if one end is free, it becomes TORQUE!
    else {
        this.velocity.multiplyBy(0); // make sure the velocity vector stays 0.
        if (this.node1.isFixed)
            this.angVel.addBy(new Vector3(this.node1.getXYZ(), this.node2.getXYZ()).cross(F).multiplyBy(timestep));
        else
            this.angVel.addBy(new Vector3(this.node2.getXYZ(), this.node1.getXYZ()).cross(F).multiplyBy(timestep));   
        // Also apply the force to where it came from
        if (this.link1.isLink) {
            this.link1.applyForceToEnd(F);
        }       
    }
}

// Apply force to node 2.
function applyForceToNode2(F) {
    // assume node 1 is a pivot because screw being generic
    var pivot = this.node1.position;
    var end = this.node2.position;
    // add torque
    this.angVel.addBy(new Vector3(pivot.xyz, end.xyz).cross(F).multiplyBy(timestep));
    // since node1 is a pivot we don't have to add the force.
}

function step() {
    var oldpos = this.node2.position; // assuming node1 is pivot 
    if (this.node1.isFixed && this.node2.isFixed)
        return;
    else if (!this.node1.isFixed && !this.node2.isFixed) {
/*      node1.position.addBy(this.velocity.multiply(timestep));
        node2.position.addBy(this.velocity.multiply(timestep));*/
    }
    else if (this.node1.isFixed) {
        var P = new Vector3(this.node1.getXYZ(), this.node2.getXYZ());//position vector
        var res = rotateVector(P, this.angVel.multiply(timestep));
        this.node2.position = this.node1.position.add(res);
        if (this.link2.isLink) { // Basically, if we're working on the top rod.
            // Finally, we need to move the rod connected to node2.
            var deltaPos = this.node2.position.subtract(oldpos);
            this.link2.node1.position.addBy(deltaPos);
            this.link2.node2.position.addBy(deltaPos);
            // Apply torque caused by this, too.
            var pivot = this.link2.node2.position;//getMidpoint(this.link2.node1.position, this.link2.node2.position);
            this.angVel.addBy(new Vector3(pivot.xyz, this.node2.getXYZ()).cross(deltaPos).multiplyBy(timestep));
        }
    }
    else {
        var P = new Vector3(node2.getXYZ(), node1.getXYZ());//position vector
        var res = rotateVector(P, this.angVel.multiply(timestep));
        node1.position = node2.position.add(res);
    }
}
