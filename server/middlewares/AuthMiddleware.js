import jwt from 'jsonwebtoken'


export const verifyToken = (request, response, next) => {
    const token = request.cookies.jwt;
    // console.log("Token:", token); // debug
    if(!token) return response.status(401).send("You are not authenticated!");
    jwt.verify(token, process.env.JWT_KEY, async(err, payload) => {
        if(err) return response.status(403).send("TOken is not valid!");
        // console.log("JWT payload:", payload); //debug
        request.userId = payload.userId;
        next();
    });
};