const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let points = [
    {x:150, y:30},
    {x:50, y:220},
    {x:250, y:220}
];
let velocity = [
    {x:0, y:0},
    {x:0, y:0},
    {x:0, y:0}
];
const gravity = 0.4;
const friction = 0.98;
let dragIndex = -1;
let stretching = false;
let stretchIndex = -1;
let draggingBody = false;
const restLength = [];
const baseRestLength = [];
let stretchStartMouse = {x: 0, y: 0};
let lastMouse = {x: 0, y: 0};
const keys = {
    a: false,
    d: false
};
document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
});
function initRestLength(){
    for(let i = 0; i < 3; i++){
        let j = (i + 1) % 3;
        let dx = points[j].x - points[i].x;
        let dy = points[j].y - points[i].y;
        let len = Math.sqrt(dx * dx + dy * dy);
        restLength[i] = len;
        baseRestLength[i] = len;
    }
}
function applyConstraint(){
    for(let i = 0; i < 3; i++){
        let j = (i + 1) % 3;
        let dx = points[j].x - points[i].x;
        let dy = points[j].y - points[i].y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if(dist === 0) continue;
        let diff = (dist - restLength[i]) / dist;
        let offsetX = dx * diff * 0.5;
        let offsetY = dy * diff * 0.5;
        if(i !== dragIndex){
            points[i].x += offsetX;
            points[i].y += offsetY;
        }
        if(j !== dragIndex){
            points[j].x -= offsetX;
            points[j].y -= offsetY;
        }
    }
}
function setStretchTarget(mouse){
    if(stretchIndex === -1) return;
    const pull = Math.hypot(
        mouse.x - stretchStartMouse.x,
        mouse.y - stretchStartMouse.y
    );
    const factor = Math.min(3, 1 + pull / 140);
    for(let i = 0; i < 3; i++){
        restLength[i] = baseRestLength[i];
    }
    if(stretchIndex === 0){
        restLength[0] = baseRestLength[0] * factor;
        restLength[2] = baseRestLength[2] * factor;
    } else if(stretchIndex === 1){
        restLength[0] = baseRestLength[0] * factor;
        restLength[1] = baseRestLength[1] * factor;
    } else if(stretchIndex === 2){
        restLength[1] = baseRestLength[1] * factor;
        restLength[2] = baseRestLength[2] * factor;
    }
}
function relaxStretch(){
    for(let i = 0; i < 3; i++){
        restLength[i] += (baseRestLength[i] - restLength[i]) * 0.08;
    }
}
function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.lineTo(points[2].x, points[2].y);
    ctx.closePath();
    ctx.fillStyle = "rgb(98,161,230)";
    ctx.fill();
}
function getMouse(e){
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}
function pointInTriangle(p, a, b, c){
    const sign = (p1, p2, p3) => {
        return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
    };
    const d1 = sign(p, a, b);
    const d2 = sign(p, b, c);
    const d3 = sign(p, c, a);
    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
    return !(hasNeg && hasPos);
}
function nearAnyVertex(m){
    return points.some(p => Math.hypot(p.x - m.x, p.y - m.y) < 48);
}
function moveTriangle(dx){
    for(let i = 0; i < 3; i++){
        points[i].x += dx;
    }
}
canvas.addEventListener("mousedown", (e) => {
    const m = getMouse(e);
    if(e.button === 2){
        dragIndex = points.findIndex(p =>
            Math.hypot(p.x - m.x, p.y - m.y) < 48
        );
        if(dragIndex !== -1){
            stretching = true;
            stretchIndex = dragIndex;
            stretchStartMouse = m;
            velocity[dragIndex].x = 0;
            velocity[dragIndex].y = 0;
        }
        return;
    }
    if(e.button === 0){
        if(nearAnyVertex(m)){
            dragIndex = points.findIndex(p =>
                Math.hypot(p.x - m.x, p.y - m.y) < 48
            );
            if(dragIndex !== -1){
                velocity[dragIndex].x = 0;
                velocity[dragIndex].y = 0;
            }
        } else if(pointInTriangle(m, points[0], points[1], points[2])){
            draggingBody = true;
            lastMouse = m;
            for(let i = 0; i < 3; i++){
                velocity[i].x = 0;
                velocity[i].y = 0;
            }
        }
    }
});
canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
});
canvas.addEventListener("mouseup", () => {
    dragIndex = -1;
    stretching = false;
    stretchIndex = -1;
    draggingBody = false;
});
canvas.addEventListener("mouseleave", () => {
    dragIndex = -1;
    stretching = false;
    stretchIndex = -1;
    draggingBody = false;
});
canvas.addEventListener("mousemove", (e) => {
    const m = getMouse(e);
    if(draggingBody){
        const dx = m.x - lastMouse.x;
        const dy = m.y - lastMouse.y;
        for(let i = 0; i < 3; i++){
            points[i].x += dx;
            points[i].y += dy;
        }
        lastMouse = m;
        draw();
        return;
    }
    if(dragIndex === -1) return;
    points[dragIndex].x = m.x;
    points[dragIndex].y = m.y;
    if(stretching){
        setStretchTarget(m);
    }
    draw();
});
window.addEventListener("keydown", (e) => {
    if(e.key === "a" || e.key === "A"){
        keys.a = true;
    }
    if(e.key === "d" || e.key === "D"){
        keys.d = true;
    }
});
window.addEventListener("keyup", (e) => {
    if(e.key === "a" || e.key === "A"){
        keys.a = false;
    }
    if(e.key === "d" || e.key === "D"){
        keys.d = false;
    }
});
function updatePhysics(){
    if(draggingBody){
        draw();
        requestAnimationFrame(updatePhysics);
        return;
    }
    let moveX = 0;
    if(keys.a) moveX -= 10;
    if(keys.d) moveX += 10;
    if(moveX !== 0){
        moveTriangle(moveX);
    }
    for(let i = 0; i < points.length; i++){
        if(i === dragIndex) continue;
        velocity[i].y += gravity;
        points[i].x += velocity[i].x;
        points[i].y += velocity[i].y;
        velocity[i].x *= friction;
        velocity[i].y *= friction;
        if(points[i].y > canvas.height - 10){
            points[i].y = canvas.height - 10;
            velocity[i].y *= -0.6;
        }
    }
    for(let k = 0; k < 6; k++){
        applyConstraint();
    }
    if(!stretching){
        relaxStretch();
    }
    draw();
    requestAnimationFrame(updatePhysics);
}
initRestLength();
draw();
updatePhysics();
